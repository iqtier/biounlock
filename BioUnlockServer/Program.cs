using Fido2NetLib;
using Fido2NetLib.Objects;
using System.Text;
using System.Linq;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddFido2(options =>
{
    options.RPID = "localhost";
    options.RPName = "Fido2 Test Server";
    options.Origins = new HashSet<string> { "http://localhost:3000" };
    options.TimestampDriftTolerance = (int)TimeSpan.FromMinutes(5).TotalMilliseconds;
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
var app = builder.Build();
app.UseSession();
app.UseCors("AllowNextApp");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Converts a base64url-encoded string (WebAuthn's format for sending
// binary IDs as text) back into raw bytes so we can compare it directly
// against the bytes we stored earlier.
static byte[] DecodeBase64Url(string input)
{
    string base64 = input.Replace('-', '+').Replace('_', '/');
    switch (base64.Length % 4)
    {
        case 2: base64 += "=="; break;
        case 3: base64 += "="; break;
    }
    return Convert.FromBase64String(base64);
}
app.MapPost("/register/begin", (HttpContext http, IFido2 fido2) =>
{
    var user = new Fido2User
    {
        DisplayName = "Iqtier",
        Name = "Ahammad",
        Id = Encoding.UTF8.GetBytes("iqtier-user-id")
    };
    var options = fido2.RequestNewCredential(new RequestNewCredentialParams
    {
        User = user,
        ExcludeCredentials = new List<PublicKeyCredentialDescriptor>(),
        AuthenticatorSelection = AuthenticatorSelection.Default,
        AttestationPreference = AttestationConveyancePreference.None
    }
    );
    http.Session.SetString("fido2.attestationOptions", options.ToJson());
    return Results.Json(options);

});


app.MapPost("/register/complete", async (HttpContext http, IFido2 fido2, AuthenticatorAttestationRawResponse attestationResponse) =>
{
    var jsonOptions = http.Session.GetString("fido2.attestationOptions");
    http.Session.Remove("fido2.attestationOptions");

    if (string.IsNullOrWhiteSpace(jsonOptions))
    {
        return Results.BadRequest(new { error = "Missing attestation options." });
    }

    var options = CredentialCreateOptions.FromJson(jsonOptions);

    IsCredentialIdUniqueToUserAsyncDelegate callback = (args, cancellationToken) =>
    {
        bool alreadyExists = CredentialStore.Credentials.Any(c => c.CredentialId.SequenceEqual(args.CredentialId));
        return Task.FromResult(!alreadyExists);
    };
    var result = await fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
    {
        AttestationResponse = attestationResponse,
        OriginalOptions = options,
        IsCredentialIdUniqueToUserCallback = callback
    });

    CredentialStore.Credentials.Add(new StoredCredential
    {
        UserId = result.User.Id,
        CredentialId = result.Id,
        PublicKey = result.PublicKey,
        SignCount = result.SignCount
    });

    return Results.Json(new { status = "ok" });
});

// Starts a login attempt by generating a fresh challenge
// for the phone to sign with its already-registered key.
app.MapPost("/login/begin", (HttpContext http, IFido2 fido2) =>
{
    // Build the list of credentials we'll accept a signature from,
    // based on what's already registered in our in-memory store.
    var existingCredentials = CredentialStore.Credentials
        .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
        .ToList();

    // Ask Fido2NetLib to generate the actual challenge and options
    // that get sent to the browser/phone.
    var options = fido2.GetAssertionOptions(new GetAssertionOptionsParams
    {
        AllowedCredentials = existingCredentials,
        UserVerification = UserVerificationRequirement.Preferred
    });

    // Temporarily save the challenge so /login/complete can check
    // the signed response against the exact same challenge later.
    http.Session.SetString("fido2.assertionOptions", options.ToJson());

    return Results.Json(options);
});

// Verifies the signed response the phone sent back, proving it holds
// the private key that matches a credential we registered earlier.
app.MapPost("/login/complete", async (HttpContext http, IFido2 fido2, AuthenticatorAssertionRawResponse clientResponse) =>
{
    // Retrieve and remove the challenge we saved in /login/begin.
    var jsonOptions = http.Session.GetString("fido2.assertionOptions");
    http.Session.Remove("fido2.assertionOptions");

    if (string.IsNullOrWhiteSpace(jsonOptions))
    {
        return Results.BadRequest(new { error = "Missing assertion options." });
    }

    var options = AssertionOptions.FromJson(jsonOptions);

    // Look up the credential the phone claims to be using.
    // clientResponse.Id comes back as a base64url string, so we decode
    // it to raw bytes before comparing against what we stored.
    var storedCred = CredentialStore.Credentials
    .FirstOrDefault(c => c.CredentialId.SequenceEqual(DecodeBase64Url(clientResponse.Id)));

    if (storedCred == null)
        return Results.BadRequest(new { error = "Unknown credential" });

    // Confirms the userHandle in the response actually belongs to
    // the credential being used. Simplified here since we only have one user.
    IsUserHandleOwnerOfCredentialIdAsync callback = (args, cancellationToken) =>
    {
        bool owns = CredentialStore.Credentials.Any(c => c.CredentialId.SequenceEqual(args.CredentialId));
        return Task.FromResult(owns);
    };

    // The actual cryptographic check: does the signature match the
    // stored public key and the challenge we sent?
    var result = await fido2.MakeAssertionAsync(new MakeAssertionParams
    {
        AssertionResponse = clientResponse,
        OriginalOptions = options,
        StoredPublicKey = storedCred.PublicKey,
        StoredSignatureCounter = storedCred.SignCount,
        IsUserHandleOwnerOfCredentialIdCallback = callback
    });

    // Update the sign count to guard against replayed/cloned credentials.
    storedCred.SignCount = result.SignCount;

    return Results.Json(new { status = "unlocked" });
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

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
    options.Origins = new HashSet<string> { "https://localhost:7159" };
    options.TimestampDriftTolerance = (int)TimeSpan.FromMinutes(5).TotalMilliseconds;
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
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

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

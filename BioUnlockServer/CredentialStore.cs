public class StoredCredential
{
    public required byte[] UserId { get; set; }
    public required byte[] CredentialId { get; set; }
    public required byte[] PublicKey { get; set; }
    public required uint SignCount { get; set; }

}

public static class CredentialStore
{
    public static readonly List<StoredCredential> Credentials = new ();
}
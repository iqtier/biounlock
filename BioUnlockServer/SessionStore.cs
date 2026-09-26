using System.Collections.Concurrent;

// Tracks active login attempts by a short code, and whether
// the phone has confirmed the fingerprint check for that code yet.
public static class SessionStore
{
    // ConcurrentDictionary (a dictionary safe to read and write from
    // multiple requests at the same time, unlike a plain Dictionary,
    // which can corrupt itself under simultaneous access; we need this
    // since the PC will be repeatedly checking status while the phone
    // is separately confirming it)
    public static readonly ConcurrentDictionary<string, string> Sessions = new();
}
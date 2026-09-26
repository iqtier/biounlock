"use client";

import Link from "next/link";
import { useState } from "react";

// This is your ASP.NET Core server's address. Since we're testing over
// your home network (needed so your phone can reach it too), this uses
// the sslip.io hostname trick instead of "localhost".
const SERVER_URL = "https://192.168.2.181.sslip.io:7159";

// WebAuthn sends binary data (like the challenge) as base64url text in JSON,
// but the browser's WebAuthn API needs raw binary. This converts text back to binary.
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// The reverse: converts raw binary from the browser back into base64url text,
// so we can send it to the server as normal JSON.
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function RegisterPage() {
  const [status, setStatus] = useState("");

  async function handleRegister() {
    setStatus("Requesting challenge...");

    // Ask the server to generate a new WebAuthn registration challenge.
    const beginRes = await fetch(`${SERVER_URL}/register/begin`, {
      method: "POST",
      credentials: "include", // sends the session cookie holding the saved challenge
    });
    const options = await beginRes.json();

    // Convert the challenge and user ID from base64url text back into
    // raw binary, since that's what navigator.credentials.create() expects.
    const publicKey: PublicKeyCredentialCreationOptions = {
      ...options,
      challenge: base64urlToBuffer(options.challenge),
      user: {
        ...options.user,
        id: base64urlToBuffer(options.user.id),
      },
    };

    setStatus("Waiting for fingerprint...");

    // This is the actual browser API call that pops up the fingerprint prompt.
    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;

    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

    // Package up what the browser gave us back into JSON the server can verify.
    const completePayload = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: bufferToBase64url(attestationResponse.attestationObject),
        clientDataJson: bufferToBase64url(attestationResponse.clientDataJSON),
      },
    };

    setStatus("Verifying with server...");

    // Send the signed credential to the server to verify and store the public key.
    const completeRes = await fetch(`${SERVER_URL}/register/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(completePayload),
    });

    const result = await completeRes.json();
    setStatus(JSON.stringify(result));
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>BioUnlock Registration</h1>
      <button
        style={{
        background: '#0070f3',
        color: 'white',
        cursor: 'pointer',
        border: 'none',
        padding: '10px 20px',    /* Adds comfortable breathing room inside the button */
        borderRadius: '6px',      /* Smooth, modern rounded corners */
        fontSize: '15px',
        fontWeight: '500',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Subtle depth shadow */
        transition: 'background 0.2s ease'
      }}
        onClick={handleRegister}
      >
        Register Fingerprint
      </button>
      <p>{status}</p>

      <Link
        href="/login"
        style={{
          color: '#0070f3',
          textDecoration: 'underline',
          fontSize: '14px'
        }}
      >
        Go to Login Page
      </Link>
    </div>
  );
}
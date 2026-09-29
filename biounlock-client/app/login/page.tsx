"use client";

import Link from "next/link";
import { useState } from "react";

const SERVER_URL = "https://pc-biounlock-bjefhgd0d0afdtb6.mexicocentral-01.azurewebsites.net";

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function LoginPage() {
  // Holds whatever code the user typed in from their PC's login screen.
  const [sessionCode, setSessionCode] = useState("");
  const [status, setStatus] = useState("");

  async function handleLogin() {
    setStatus("Requesting challenge...");

    const beginRes = await fetch(`${SERVER_URL}/login/begin`, {
      method: "POST",
      credentials: "include",
    });
    const options = await beginRes.json();

    const publicKey: PublicKeyCredentialRequestOptions = {
      ...options,
      challenge: base64urlToBuffer(options.challenge),
      allowCredentials: options.allowCredentials?.map((c: any) => ({
        ...c,
        id: base64urlToBuffer(c.id),
      })),
    };

    setStatus("Waiting for fingerprint...");

    const credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;

    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    const completePayload = {
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
        clientDataJson: bufferToBase64url(assertionResponse.clientDataJSON),
        signature: bufferToBase64url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? bufferToBase64url(assertionResponse.userHandle)
          : null,
      },
    };

    setStatus("Verifying with server...");

    // The sessionCode gets attached as a query parameter, so the
    // server knows which PC's waiting session to mark confirmed.
    const completeRes = await fetch(
      `${SERVER_URL}/login/complete?sessionCode=${sessionCode}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completePayload),
      }
    );

    const result = await completeRes.json();
    setStatus(JSON.stringify(result));
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>BioUnlock Login</h1>
      <input
        type="text"
        placeholder="Enter code from PC"
        value={sessionCode}
        onChange={(e) => setSessionCode(e.target.value)}
        style={{ fontSize: 20, padding: 8, marginBottom: 10 }}
      />
      <br />
      <button style={{
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
      }} onClick={handleLogin}>Unlock with Fingerprint</button>
      <p>{status}</p>

      <Link
        href="/register"
        style={{
          color: '#0070f3',
          textDecoration: 'underline',
          fontSize: '14px'
        }}
      >
        Go to Resgister Page
      </Link>
    </div>


  );
}
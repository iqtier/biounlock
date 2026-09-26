"use client";

import { useState } from "react";

const SERVER_URL = "https://localhost:7159";

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

    const completeRes = await fetch(`${SERVER_URL}/login/complete`, {
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
      <h1>BioUnlock Login</h1>
      <button onClick={handleLogin}>Unlock with Fingerprint</button>
      <p>{status}</p>
    </div>
  );
}
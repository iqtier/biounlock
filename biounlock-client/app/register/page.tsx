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

export default function RegisterPage() {
  const [status, setStatus] = useState("");

  async function handleRegister() {
    setStatus("Requesting challenge...");

    const beginRes = await fetch(`${SERVER_URL}/register/begin`, {
      method: "POST",
      credentials: "include",
    });
    const options = await beginRes.json();

    const publicKey: PublicKeyCredentialCreationOptions = {
      ...options,
      challenge: base64urlToBuffer(options.challenge),
      user: {
        ...options.user,
        id: base64urlToBuffer(options.user.id),
      },
    };

    setStatus("Waiting for fingerprint...");

    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;

    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

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
      <button onClick={handleRegister}>Register Fingerprint</button>
      <p>{status}</p>
    </div>
  );
}
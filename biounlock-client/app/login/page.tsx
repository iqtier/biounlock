"use client";

import { useState } from "react";
import Link from "next/link";
import FingerprintButton, { BiometricState } from "@/components/FingerprintButton";
import { ShieldCheck, UserCheck, AlertTriangle, ChevronRight, Lock, KeyRound } from "lucide-react";

const SERVER_URL = "https://192.168.2.181.sslip.io:7159";

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
  const [state, setState] = useState<BiometricState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("Ready to authenticate");
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  async function handleLogin() {
    setState("requesting");
    setStatusMessage("Requesting challenge from server...");
    setRawResult(null);

    try {
      const beginRes = await fetch(`${SERVER_URL}/login/begin`, {
        method: "POST",
        credentials: "include",
      });

      if (!beginRes.ok) {
        throw new Error(`Server returned ${beginRes.status}: ${beginRes.statusText}`);
      }

      const options = await beginRes.json();

      const publicKey: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        allowCredentials: options.allowCredentials?.map((c: any) => ({
          ...c,
          id: base64urlToBuffer(c.id),
        })),
      };

      setState("scanning");
      setStatusMessage("Scan your fingerprint on your device sensor...");

      const credential = (await navigator.credentials.get({
        publicKey,
      })) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Biometric prompt was cancelled or failed");
      }

      setState("verifying");
      setStatusMessage("Verifying biometric token with server...");

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

      const completeRes = await fetch(`${SERVER_URL}/login/complete`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completePayload),
      });

      const result = await completeRes.json();
      setRawResult(JSON.stringify(result, null, 2));

      if (completeRes.ok && (result.success !== false && result.status !== "error")) {
        setState("success");
        setStatusMessage("Authentication successful! Welcome back.");
      } else {
        setState("error");
        setStatusMessage(result.message || "Authentication verification failed.");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setState("error");
      setStatusMessage(err.message || "Failed to complete biometric authentication.");
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="relative w-full max-w-md bg-zinc-900/80 backdrop-blur-2xl border border-zinc-800/80 shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col items-center">
        {/* Top security badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-medium tracking-wide mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FIDO2 / WebAuthn Protected</span>
        </div>

        {/* Title & subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            BioUnlock
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Touch the biometric fingerprint sensor below to unlock your account
          </p>
        </div>

        {/* Fingerprint Scanner Button */}
        <div className="my-3">
          <FingerprintButton
            state={state}
            onClick={handleLogin}
            label={
              state === "scanning"
                ? "Touch sensor now"
                : state === "requesting"
                ? "Requesting challenge..."
                : state === "verifying"
                ? "Verifying identity..."
                : state === "success"
                ? "Unlocked!"
                : state === "error"
                ? "Retry Scan"
                : "Touch Sensor to Unlock"
            }
            sublabel={
              state === "idle"
                ? "Tap to scan registered fingerprint"
                : state === "scanning"
                ? "Place your finger on device reader"
                : undefined
            }
          />
        </div>

        {/* Dynamic Status Banner */}
        <div
          className={`w-full mt-6 px-4 py-3 rounded-xl border text-sm transition-all duration-300 flex items-start gap-3 ${
            state === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : state === "error"
              ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
              : state === "scanning" || state === "requesting" || state === "verifying"
              ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200"
              : "bg-zinc-800/40 border-zinc-700/50 text-zinc-400"
          }`}
        >
          {state === "success" ? (
            <UserCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : state === "error" ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <KeyRound className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium text-xs tracking-wider uppercase opacity-75">
              System Status
            </p>
            <p className="text-sm mt-0.5">{statusMessage}</p>
          </div>
        </div>

        {/* Raw Server Response Toggle for Debugging */}
        {rawResult && (
          <div className="w-full mt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
            >
              {showDetails ? "Hide technical details" : "View technical server response"}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-zinc-800 text-xs font-mono text-zinc-300 max-h-40 overflow-auto whitespace-pre-wrap">
                {rawResult}
              </pre>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 w-full border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Need a new passkey?</span>
          <Link
            href="/register"
            className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            Register Fingerprint
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
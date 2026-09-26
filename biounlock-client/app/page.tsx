import Link from "next/link";
import { Fingerprint, Lock, ShieldCheck, ArrowRight, UserPlus } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100 relative overflow-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-xs font-medium tracking-wide mb-6">
          <ShieldCheck className="w-4 h-4" />
          <span>FIDO2 / WebAuthn Biometric Security</span>
        </div>

        {/* Hero Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <Fingerprint className="w-12 h-12 text-cyan-400" />
          </div>
          <span className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping [animation-duration:3s]" />
        </div>

        {/* Heading & description */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          BioUnlock Portal
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md">
          Hardware-backed biometric authentication powered by WebAuthn passkeys. Seamless passwordless login using your fingerprint sensor.
        </p>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8">
          <Link
            href="/login"
            className="group relative flex flex-col items-start p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-850 transition-all duration-300 shadow-lg text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
              Login
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Authenticate quickly with your enrolled fingerprint sensor.
            </p>
          </Link>

          <Link
            href="/register"
            className="group relative flex flex-col items-start p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-teal-500/50 hover:bg-zinc-850 transition-all duration-300 shadow-lg text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-950/60 border border-teal-800/50 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
              Register
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Enroll a new fingerprint passkey on this device.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

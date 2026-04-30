"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFromCookie } from "@/lib/auth";
import { connectTelegram, logout } from "@/lib/api";
import {
  Settings,
  User,
  Fingerprint,
  ShieldCheck,
  Lock,
  Send,
  CheckCircle2,
  LogOut,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const user = getUserFromCookie();

  const [telegramHandle, setTelegramHandle] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(
    !!(user as { telegramHandle?: string } | null)?.telegramHandle,
  );
  const [telegramError, setTelegramError] = useState("");

  const [loggingOut, setLoggingOut] = useState(false);

  const cardStyle =
    "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50";
  const headerLabelStyle =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  async function handleConnectTelegram() {
    const handle = telegramHandle.replace(/^@/, "").trim();
    if (!handle) return;
    setConnecting(true);
    setTelegramError("");
    try {
      await connectTelegram(handle);
      setConnected(true);
    } catch {
      setTelegramError(
        "Could not connect Telegram. Check your handle and try again.",
      );
    } finally {
      setConnecting(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // ignore — clear cookies regardless
    }
    const pastDate = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `token=; expires=${pastDate}; path=/`;
    document.cookie = `user=; expires=${pastDate}; path=/`;
    router.push("/login");
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Settings className="w-3.5 h-3.5" />
            <span>Console Preferences Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Manage your clinical profile and system configurations.
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>{loggingOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className={`${cardStyle} p-10 flex flex-col`}>
          <div className="mb-10">
            <h4 className={headerLabelStyle}>Identity</h4>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">
              User Profile
            </h3>
          </div>

          {user ? (
            <div className="space-y-6">
              {[
                { label: "Full Name", value: user.name, icon: User },
                {
                  label: "Auth Identifier",
                  value: user.email,
                  icon: Fingerprint,
                },
                {
                  label: "Privilege Level",
                  value: user.role.toUpperCase(),
                  icon: ShieldCheck,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all hover:bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-emerald-200 group-hover:text-emerald-500 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {label}
                      </p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                Session Inactive
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Security card */}
          <div
            className={`${cardStyle} p-10 bg-slate-900 text-white border-none`}
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
              Protocol Security
            </h4>
            <h3 className="text-xl font-bold mb-4">Encryption Active</h3>
            <p className="text-xs text-white/60 leading-relaxed font-medium">
              All clinical data is encrypted via AES-256 at rest and TLS 1.3 in
              transit. Your session is cryptographically signed.
            </p>
          </div>

          {/* Interface Preferences */}
          <div className={`${cardStyle} p-10`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className={headerLabelStyle}>Preferences</h4>
                <h3 className="text-xl font-black text-slate-900">Interface</h3>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                Brutalism v4
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Diagnostic Mode
                </span>
                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center px-1">
                  <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Low Latency UI
                </span>
                <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center px-1">
                  <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Connect — full-width card */}
        <div className={`${cardStyle} p-10 md:col-span-2`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Send className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className={headerLabelStyle}>Integrations</h4>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                Telegram Notifications
              </h3>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest max-w-md">
                Connect your Telegram account to receive real-time patient
                alerts and pipeline completion notices.
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {connected ? (
                <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-0.5">
                      Connected
                    </p>
                    <p className="text-sm font-black text-slate-900">
                      @
                      {telegramHandle ||
                        (user as { telegramHandle?: string } | null)
                          ?.telegramHandle ||
                        "your-account"}
                    </p>
                  </div>
                  <button
                    onClick={() => setConnected(false)}
                    className="ml-auto text-[9px] font-bold text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 block">
                      Telegram Handle
                    </label>
                    <input
                      type="text"
                      value={telegramHandle}
                      onChange={(e) => setTelegramHandle(e.target.value)}
                      placeholder="@yourusername"
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-400/50 transition-all"
                    />
                  </div>

                  {telegramError && (
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      {telegramError}
                    </p>
                  )}

                  <button
                    onClick={handleConnectTelegram}
                    disabled={connecting || !telegramHandle.trim()}
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Connect Telegram
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

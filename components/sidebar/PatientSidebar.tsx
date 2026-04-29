"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Pill, 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  Send,
  Activity,
  ChevronRight,
  Settings
} from "lucide-react";
import { getUserFromCookie, clearAuthCookie } from "@/lib/auth";
import { connectTelegram } from "@/lib/api";
import type { User as UserType } from "@/types";

const NAV_ITEMS = [
  { icon: Home, label: "My Dashboard", href: "/patient" },
  { icon: Pill, label: "My Medications", href: "/patient/medications" },
  { icon: Bell, label: "My Health Alerts", href: "/patient/alerts" },
  { icon: Settings, label: "Account Config", href: "/patient/profile" },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [telegramHandle, setTelegramHandle] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  const handleConnect = async () => {
    if (!telegramHandle.trim()) return;
    setConnecting(true);
    try {
      await connectTelegram(telegramHandle.trim());
      // Re-fetch user or update state would be better here
    } catch {
      // Error handling
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-bg-surface border-r border-white/5 flex flex-col z-[100] hidden lg:flex">
      {/* Brand Header */}
      <div className="p-8 border-b border-white/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-accent-primary/10 rounded-lg border border-accent-primary/20 shadow-[0_0_15px_var(--accent-glow)]">
            <Activity className="w-5 h-5 text-accent-primary" />
          </div>
          <span className="font-display text-xl font-black tracking-tighter text-white">HEALYNX</span>
        </div>

        {/* Patient Identity */}
        {user && (
          <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 group hover:border-accent-primary/20 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-display text-xs font-black text-accent-primary transition-all">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <div className="font-display text-xs font-bold text-white truncate uppercase tracking-tight">{user.name}</div>
              <div className="font-display text-[8px] text-text-muted uppercase tracking-[0.2em] mt-0.5">Verified Health Profile</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="p-4 space-y-1">
        <div className="px-4 py-2 font-display text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">Personal Health Systems</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 font-display text-[11px] font-bold tracking-widest uppercase transition-all group ${
                isActive 
                  ? "bg-accent-primary text-bg-base shadow-[0_0_20px_var(--accent-glow)] translate-x-2" 
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-bg-base" : "text-accent-primary/60 group-hover:text-accent-primary"}`} />
              {item.label}
              {isActive && <ChevronRight className="ml-auto w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Security Hub / Telegram */}
      <div className="mt-auto p-6 space-y-4">
        <div className="glass-panel p-5 bg-white/[0.02] border-white/5">
          <h4 className="font-display text-[9px] font-black text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Send className="w-3 h-3 text-accent-primary" /> Intelligence Link
          </h4>
          
          {user?.telegramHandle ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-risk-safe/10 border border-risk-safe/20 rounded-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-risk-safe animate-pulse" />
              <span className="font-display text-[9px] font-bold text-risk-safe uppercase tracking-widest">Active Link: {user.telegramHandle}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <input 
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                placeholder="@handle" 
                className="w-full bg-bg-base/40 border border-white/5 px-3 py-2 text-[10px] font-display uppercase tracking-widest outline-none focus:border-accent-primary/30 transition-all"
              />
              <button 
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-2 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-display text-[9px] font-black uppercase tracking-[0.2em] hover:bg-accent-primary hover:text-bg-base transition-all"
              >
                {connecting ? "Linking..." : "Establish Link"}
              </button>
            </div>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-4 py-3 font-display text-[10px] font-black tracking-[0.3em] uppercase text-text-muted hover:text-risk-critical hover:bg-risk-critical/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> End Session
        </button>
      </div>
    </aside>
  );
}

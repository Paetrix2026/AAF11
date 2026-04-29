"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { login } from "@/lib/api";
import { setAuthCookie, setUserCookie } from "@/lib/auth";
import { 
  ShieldAlert, 
  Fingerprint, 
  ArrowRight, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Mail,
  Zap,
  Terminal,
  Cpu
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  // Decorative scan effect
  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password, role);
      setAuthCookie(data.token);
      setUserCookie(data.user);
      router.push(data.user.role === "doctor" ? "/doctor" : "/patient");
    } catch (err: any) {
      setError(err.message || "Authorization failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative selection:bg-accent-primary/30 font-body">
      {/* 1. Background System (Standardized with Landing) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white bg-[size:40px_40px] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-bg-base via-transparent to-accent-primary/5" />
        
        {/* Floating Technical Elements */}
        <div className="absolute top-10 left-10 text-[8px] font-display text-foreground/20 tracking-[0.4em] uppercase leading-relaxed hidden lg:block">
          Terminal Status: Active<br />
          Node ID: HLX-4921-X<br />
          Encryption: AES-256-GCM
        </div>
        <div className="absolute bottom-10 right-10 text-[8px] font-display text-foreground/20 tracking-[0.4em] uppercase leading-relaxed text-right hidden lg:block">
          Protocol: Secure Transfer<br />
          Location: Secure Cloud Tier-4<br />
          © 2026 HEALYNX SYSTEMS
        </div>
      </div>

      {/* 2. Main Login Console */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="glass-panel relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Scanning Beam Animation */}
          <motion.div 
            style={{ top: `${scanProgress}%` }}
            className="absolute left-0 right-0 h-px bg-accent-primary/30 z-20 shadow-[0_0_15px_var(--accent-glow)] pointer-events-none"
          />

          {/* Header Section */}
          <div className="p-12 border-b border-white/5 bg-white/[0.02] relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent-primary/10 border border-accent-primary/20">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display text-xl font-black tracking-tighter text-foreground">HEALYNX</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_8px_var(--accent-glow)]" />
                <span className="font-display text-[9px] font-black text-primary uppercase tracking-[0.2em]">Live Connection</span>
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-black tracking-tighter uppercase text-foreground mb-2 leading-none">
              System <span className="text-primary text-glow">Access</span>
            </h1>
            <p className="font-display text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Authorized Personnel Only • Identity Verification Protocol 1.2.4
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setRole("doctor")}
              className={`flex-1 py-4 font-display text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                role === "doctor" 
                  ? "bg-accent-primary text-bg-base" 
                  : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              <Cpu className="w-4 h-4" /> Clinical Lead
            </button>
            <button 
              onClick={() => setRole("patient")}
              className={`flex-1 py-4 font-display text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                role === "patient" 
                  ? "bg-accent-primary text-bg-base" 
                  : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              <Zap className="w-4 h-4" /> Patient Portal
            </button>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="p-12 space-y-8 bg-black/20">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="p-4 bg-risk-critical/10 border border-risk-critical/30 flex items-center gap-4 text-risk-critical font-display text-[10px] font-black uppercase tracking-widest"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <div className="group relative">
                <label className="block font-display text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 group-focus-within:text-primary transition-colors">
                  Identity Signature (Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 px-12 py-4 text-sm font-display text-foreground outline-none focus:border-accent-primary/50 focus:bg-white/[0.05] transition-all"
                    placeholder="name@hospital.org"
                  />
                </div>
              </div>

              <div className="group relative">
                <label className="block font-display text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 group-focus-within:text-primary transition-colors">
                  Authorization Key (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 px-12 py-4 text-sm font-display text-foreground outline-none focus:border-accent-primary/50 focus:bg-white/[0.05] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-6 bg-accent-primary text-bg-base font-display font-black uppercase text-sm tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,229,195,0.2)]"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 animate-spin" /> Authorizing...
                </div>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" /> Establish Session <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex justify-between items-center pt-8 border-t border-white/5 text-[9px] font-display font-black text-muted-foreground uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Verified by PÆTRIX OS
              </div>
              <Link href="/" className="hover:text-primary transition-colors">
                Return to Terminal
              </Link>
            </div>
          </form>
        </div>

        {/* Decorative Bottom Accents */}
        <div className="mt-8 flex justify-between px-2">
          <div className="w-24 h-[2px] bg-white/10 relative overflow-hidden">
            <motion.div 
              animate={{ left: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 bottom-0 w-1/2 bg-accent-primary/40 blur-sm"
            />
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-1.5 h-1.5 border border-white/20 rotate-45" />
            ))}
          </div>
          <div className="w-24 h-[2px] bg-white/10 relative overflow-hidden">
            <motion.div 
              animate={{ right: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 bottom-0 w-1/2 bg-accent-primary/40 blur-sm"
            />
          </div>
        </div>
      </motion.div>
    </main>
  );
}

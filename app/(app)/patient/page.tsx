"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { getUserFromCookie } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Activity, 
  Shield, 
  MapPin, 
  Pill, 
  History, 
  Bell, 
  CheckCircle2, 
  Calendar,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  Microscope
} from "lucide-react";
import type { Alert, User } from "@/types";

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUserFromCookie();
    setUser(u);
    getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const recentAlerts = alerts.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-grid-white bg-[size:32px_32px] opacity-10" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="p-4 bg-accent-primary/5 rounded-full border border-accent-primary/20 mb-4 shadow-[0_0_20px_var(--accent-glow)]"
        >
          <Activity className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="font-display text-[10px] tracking-[0.4em] text-primary uppercase font-black">
          Establishing Bio-Link...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-body selection:bg-accent-primary/30 relative overflow-hidden">
      {/* 1. Background System */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white bg-[size:40px_40px] opacity-[0.05]" />
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-accent-primary/5 via-transparent to-transparent opacity-40" />
        
        {/* Decorative Technical Labels */}
        <div className="absolute top-8 left-12 text-[7px] font-display text-foreground/10 uppercase tracking-[0.4em]">
          HLX-PATIENT-NODE :: ENCRYPTED_STREAM
        </div>
      </div>

      <div className="relative z-10 p-6 md:p-12 max-w-[1400px] mx-auto">
        {/* 2. Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-accent-primary/10 border border-accent-primary/20 text-[9px] font-display font-black text-primary uppercase tracking-[0.3em]">
                Secure Patient Portal
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-display text-[9px] uppercase tracking-[0.3em]">
                <Lock className="w-3 h-3" /> RSA-4096 Active
              </div>
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.8]">
              {user ? `Hello, ${user.name.split(" ")[0]}` : "Health Console"}
            </h1>
            <p className="text-muted-foreground font-display text-[11px] tracking-[0.2em] uppercase mt-6 flex items-center gap-3">
              Unified Bio-Profile <div className="w-8 h-px bg-white/10" /> Sync: {new Date().toLocaleTimeString()}
            </p>
          </motion.div>

          <div className="flex gap-4 w-full xl:w-auto">
            <button className="flex-1 xl:flex-none bg-white/[0.02] border border-white/10 px-8 py-4 font-display text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white/5 hover:border-accent-primary/30 transition-all flex items-center justify-center gap-3">
              <Calendar className="w-4 h-4 text-primary" /> Request Session
            </button>
            <button className="flex-1 xl:flex-none bg-accent-primary text-bg-base px-8 py-4 font-display text-[10px] font-black tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-[0_0_20px_var(--accent-glow)] flex items-center justify-center gap-3">
              <ShieldCheck className="w-4 h-4" /> Download Records
            </button>
          </div>
        </header>

        {/* 3. Core Indicators (Bento Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1">
          <InfoCard 
            icon={<MapPin className="w-6 h-6 text-primary" />}
            title="Geospatial Health Data"
            content="Local variant concentration levels remain at baseline."
            subContent="MONITORING ACTIVE REGION: GLOBAL"
          />
          <InfoCard 
            icon={<Pill className="w-6 h-6 text-primary" />}
            title="Medication Ledger"
            content="No pharmacological interactions currently required."
            subContent="SYNCHRONIZED WITH PHARMACY_V1"
          />
        </div>

        {/* 4. Timeline System */}
        <div className="glass-panel p-10 mb-12 relative group overflow-hidden border border-white/10 bg-black/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 font-display text-[7px] text-foreground uppercase tracking-[0.5em] pointer-events-none">
            DATA_ARCHIVE_SEC // HISTORY_01
          </div>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-2 bg-accent-primary/10 border border-accent-primary/20">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display text-xs font-black tracking-[0.3em] uppercase text-foreground">
              Clinical Diagnostic Timeline
            </h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-20 text-center border-t border-dashed border-white/5">
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-full border border-accent-primary/20 flex items-center justify-center mb-8 bg-accent-primary/5"
            >
              <Microscope className="w-8 h-8 text-primary/40" />
            </motion.div>
            <p className="font-display text-[10px] text-muted-foreground uppercase tracking-[0.4em] max-w-sm leading-relaxed font-bold">
              NO TREATMENT RECORDS DETECTED IN CURRENT PROTOCOL
            </p>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/10 rotate-45" />)}
            </div>
          </div>
        </div>

        {/* 5. Notifications & Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Intelligence Alerts */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display text-[11px] font-black tracking-[0.3em] uppercase text-foreground flex items-center gap-3">
                <Bell className="w-4 h-4 text-primary animate-pulse" /> System Alerts
              </h3>
              <div className="h-px flex-1 mx-6 bg-white/5" />
            </div>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {recentAlerts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-panel p-8 border border-white/10 bg-risk-safe/5 flex items-center gap-6 group hover:border-risk-safe/30 transition-all"
                  >
                    <div className="p-3 bg-risk-safe/10 border border-risk-safe/20 text-risk-safe group-hover:bg-risk-safe group-hover:text-bg-base transition-all">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-display text-xs font-black text-foreground uppercase tracking-widest mb-1">Status: Optimal</p>
                      <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">All clinical bio-indicators within safe limits.</p>
                    </div>
                  </motion.div>
                ) : (
                  recentAlerts.map((alert, idx) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-panel p-6 border border-white/10 group hover:border-accent-primary/30 hover:bg-white/[0.02] transition-all flex justify-between items-center"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-1 h-8 bg-accent-primary/20 group-hover:bg-accent-primary transition-colors" />
                        <div>
                          <p className="text-sm font-bold text-foreground mb-2 leading-relaxed">
                            {alert.message}
                          </p>
                          <span className="font-display text-[8px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                            {formatRelativeTime(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button className="p-3 border border-white/5 hover:border-accent-primary hover:text-primary transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Action Protocol */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-display text-[11px] font-black tracking-[0.3em] uppercase text-foreground flex items-center gap-3">
                <Cpu className="w-4 h-4 text-primary" /> Active Protocol
              </h3>
              <div className="h-px flex-1 mx-6 bg-white/5" />
            </div>
            <div className="glass-panel p-10 bg-accent-primary/[0.03] border border-accent-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary/10" />
              <div className="flex items-start gap-6">
                <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 text-primary shadow-[0_0_15px_var(--accent-glow)]">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-black text-foreground uppercase tracking-[0.2em] mb-4 group-hover:text-glow group-hover:text-primary transition-all">
                    Preventative Intelligence
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8 font-body">
                    Your current bio-profile is synchronized with the latest regional mutation data. No preventative countermeasures are indicated at this time.
                  </p>
                  <button className="px-8 py-3 bg-white text-bg-base font-display text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent-primary hover:text-bg-base transition-all flex items-center gap-3">
                    Analyze Full Protocol <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 6. Technical Footer */}
        <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-700">
           <div className="flex items-center gap-6">
              <Activity className="w-8 h-8 text-primary" />
              <div className="font-display text-[8px] text-foreground uppercase tracking-[0.5em] leading-relaxed">
                HEALYNX BIOMETRIC INTERFACE<br />
                ENCRYPTION: RSA-4096 / AES-GCM
              </div>
           </div>
           <div className="flex gap-12 font-display text-[8px] text-muted-foreground uppercase tracking-[0.3em] font-black">
             <Link href="#" className="hover:text-foreground transition-colors">Security Audit</Link>
             <Link href="#" className="hover:text-foreground transition-colors">Identity Rights</Link>
             <Link href="#" className="hover:text-foreground transition-colors">API Endpoint</Link>
           </div>
        </footer>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, content, subContent }: { icon: React.ReactNode, title: string, content: string, subContent: string }) {
  return (
    <div className="glass-panel p-10 relative group overflow-hidden border border-white/10 hover:border-accent-primary/40 transition-all bg-black/10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white/5 border border-white/10 group-hover:border-accent-primary/30 group-hover:bg-accent-primary/5 transition-all text-muted-foreground group-hover:text-primary shadow-xl">
          {icon}
        </div>
        <h3 className="font-display text-[11px] font-black tracking-[0.3em] uppercase text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </h3>
      </div>
      <p className="text-lg font-black text-foreground mb-4 leading-tight group-hover:text-glow transition-all">
        {content}
      </p>
      <div className="flex items-center gap-3">
        <div className="h-px w-6 bg-accent-primary/40" />
        <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest font-bold">
          {subContent}
        </p>
      </div>
      
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
      
      {/* Decorative Glow Line */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-accent-primary/40 w-0 group-hover:w-full transition-all duration-700" />
    </div>
  );
}

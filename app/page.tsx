"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Activity, Shield, Zap, Microscope, Terminal, Globe, Cpu, LogIn } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden selection:bg-accent-primary/30 font-body">
      {/* 1. Background System */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white bg-[size:40px_40px] z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base/0 via-bg-base/40 to-bg-base z-20" />
        <img
          src="/landing_bg.png"
          alt="Scientific Background"
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity animate-slow-pulse"
        />
        {/* Scanning Line */}
        <motion.div 
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent z-30 shadow-[0_0_15px_var(--accent-glow)]"
        />
      </div>

      {/* 2. Top Navigation */}
      <nav className="absolute top-0 left-0 w-full p-8 z-50 flex justify-between items-center mix-blend-difference">
        <div className="flex items-center gap-4">
          <Activity className="w-8 h-8 text-primary" />
          <span className="font-display text-2xl font-black tracking-tighter uppercase text-foreground">
            HEALYNX
          </span>
        </div>
        <div className="flex gap-8 items-center">
          <div className="hidden md:flex gap-8 items-center text-xs font-display tracking-widest text-foreground/60">
            <span className="flex items-center gap-2 underline underline-offset-4 decoration-accent-primary/40 underline-thickness-1">SYSTEM STATUS: OPTIMAL</span>
            <span className="flex items-center gap-2 uppercase">v1.2.4-STABLE</span>
          </div>
          <Link href="/login" className="flex items-center gap-2 px-6 py-2 border border-accent-primary text-primary font-display text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary hover:text-bg-base transition-all">
            <LogIn className="w-3 h-3" /> System Login
          </Link>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative z-40 container mx-auto px-6 pt-24">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 px-3 py-1 rounded-full border border-accent-primary/20 bg-accent-primary/5 text-[10px] font-display tracking-[0.2em] text-primary uppercase"
          >
            Next-Gen Pathogen Surveillance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="font-display text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter text-center leading-[0.85] mb-8"
          >
            CLINICAL<br />
            <span className="text-glow text-primary">INTELLIGENCE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl text-center mb-12 font-body font-light leading-relaxed tracking-tight"
          >
            Accelerating pandemic response through autonomous mutation parsing, 
            high-fidelity molecular docking, and AI-synthesized clinical recommendations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <Link
              href="/login"
              className="group relative px-12 py-6 bg-[#00e5c3] text-[#0a0b0d] font-black uppercase text-sm tracking-[0.2em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,229,195,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Initialize Platform <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <button className="px-12 py-6 border-2 border-white/20 text-foreground font-black uppercase text-sm tracking-[0.2em] transition-all hover:bg-white hover:text-[#0a0b0d]">
              Technical Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* 4. Statistics / Live Feed Ribbon */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-0 w-full flex items-center gap-12 whitespace-nowrap overflow-hidden border-y border-white/5 py-4 bg-card/50 backdrop-blur-sm z-40"
      >
        <div className="flex animate-marquee gap-12 items-center text-[10px] font-display text-foreground/40 tracking-[0.3em] uppercase">
          <StatItem icon={<Terminal className="w-3 h-3" />} label="Mutations Parsed" value="1.2M+" />
          <StatItem icon={<Cpu className="w-3 h-3" />} label="Docking Cycles" value="450k/hr" />
          <StatItem icon={<Globe className="w-3 h-3" />} label="Global Nodes" value="284" />
          <StatItem icon={<Microscope className="w-3 h-3" />} label="Active Pathogens" value="14" />
          <StatItem icon={<Terminal className="w-3 h-3" />} label="Mutations Parsed" value="1.2M+" />
          <StatItem icon={<Cpu className="w-3 h-3" />} label="Docking Cycles" value="450k/hr" />
          <StatItem icon={<Globe className="w-3 h-3" />} label="Global Nodes" value="284" />
          <StatItem icon={<Microscope className="w-3 h-3" />} label="Active Pathogens" value="14" />
        </div>
      </motion.div>

      {/* 5. Features Section */}
      <section className="relative z-40 container mx-auto px-6 mt-32 mb-48">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <FeatureCard 
            index="01"
            icon={<Zap className="w-6 h-6" />}
            title="MUTATION ENGINE"
            description="High-throughput MAFFT alignment and automated mutation scoring across global sequence repositories."
          />
          <FeatureCard 
            index="02"
            icon={<Shield className="w-6 h-6" />}
            title="DRUG SELECTIVITY"
            description="Predict off-target binding and ADMET properties using RDKit for safer therapeutic development."
          />
          <FeatureCard 
            index="03"
            icon={<Microscope className="w-6 h-6" />}
            title="DOCKING AGENT"
            description="Vina-powered screening of small molecules against pathogen protein structures with sub-angstrom precision."
          />
        </div>
      </section>

      {/* Styling for Marquee */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </main>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span>{label}:</span>
      <span className="text-[#00e5c3] font-bold">{value}</span>
    </div>
  );
}

function FeatureCard({ index, icon, title, description }: { index: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-10 flex flex-col h-full group cursor-pointer">
      <div className="flex justify-between items-start mb-12">
        <div className="p-3 bg-accent-primary/10 rounded-none group-hover:bg-accent-primary transition-colors text-primary group-hover:text-bg-base">
          {icon}
        </div>
        <span className="font-display text-4xl font-black text-foreground/5 group-hover:text-primary/20 transition-colors">
          {index}
        </span>
      </div>
      <h3 className="font-display font-black text-2xl mb-4 tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground font-light leading-relaxed">
        {description}
      </p>
      <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] font-display font-bold tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        VIEW CORE MODULE <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}

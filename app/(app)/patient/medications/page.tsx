"use client";

import { Pill, Activity, ShieldCheck, Microscope, ArrowUpRight, Zap } from "lucide-react";

export default function PatientMedicationsPage() {
  const cardStyle = "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50 shadow-sm";
  const headerLabelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-10 min-h-screen">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
          <Pill className="w-3.5 h-3.5" />
          <span>Pharmacological Ledger Active</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">My Medications</h1>
        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
          Active clinical protocols and supplement registry.
        </p>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Medication Card */}
        <div className={`${cardStyle} p-8 flex flex-col justify-between group hover:bg-white`}>
          <div className="flex justify-between items-start mb-8">
            <div>
               <h4 className={headerLabelStyle}>Current Protocol</h4>
               <h3 className="text-2xl font-black text-slate-900">Oseltamivir</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
               <Pill className="w-6 h-6" />
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Dosage</p>
                   <p className="text-xs font-bold text-slate-900">75 MG</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Frequency</p>
                   <p className="text-xs font-bold text-slate-900">Once Daily</p>
                </div>
             </div>
             
             <div className="flex items-center justify-between p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active Status</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Registry Confirmed</span>
             </div>
          </div>
        </div>

        {/* Empty / Registry Info Card */}
        <div className={`${cardStyle} p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 border-dashed border-slate-200`}>
          <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
             <Zap className="w-8 h-8 text-slate-200" />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No other active links</h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold max-w-xs leading-relaxed">
            Clinical protocols are added by your healthcare provider following analysis.
          </p>
        </div>

        {/* Intelligence Module */}
        <div className={`${cardStyle} md:col-span-2 p-10 bg-slate-900 text-white border-slate-800 flex items-center gap-10`}>
           <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center shrink-0">
              <Microscope className="w-8 h-8 text-emerald-500" />
           </div>
           <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Diagnostic Note</h4>
              <p className="text-sm font-medium text-slate-300 leading-relaxed max-w-2xl">
                Healynx assists clinical decision-making by analyzing molecular docking pathways. All listed medications are monitored for cross-interaction in real-time.
              </p>
           </div>
           <button className="ml-auto px-6 py-3 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">
              Security Audit
           </button>
        </div>

      </div>
    </div>
  );
}

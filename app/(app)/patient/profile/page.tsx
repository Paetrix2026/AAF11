"use client";

import { useEffect, useState } from "react";
import { getUserFromCookie } from "@/lib/auth";
import type { User } from "@/types";
import { User as UserIcon, ShieldCheck, Lock, Activity, ChevronRight, Globe } from "lucide-react";

export default function PatientProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  const cardStyle = "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50 shadow-sm";
  const headerLabelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
          <UserIcon className="w-3.5 h-3.5" />
          <span>Identity Profile Active</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">My Profile</h1>
        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
          Personal health identity and secure credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Account Info - WIDE BLOCK */}
        <div className={`${cardStyle} md:col-span-2 p-8`}>
          <div className="flex items-center justify-between mb-8">
             <h4 className={headerLabelStyle}>Account Registry</h4>
             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-widest">Verified</span>
          </div>

          {user ? (
            <div className="divide-y divide-slate-100">
               {[
                 { label: "Full Name", value: user.name },
                 { label: "Identity Email", value: user.email },
                 { label: "Clinical Role", value: "Verified Patient" },
                 { label: "Bio-Link Status", value: user.telegramHandle ? `@${user.telegramHandle}` : "Not established" },
               ].map((item) => (
                 <div key={item.label} className="py-4 flex justify-between items-center group">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className="text-sm font-black text-slate-900 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{item.value}</span>
                 </div>
               ))}
            </div>
          ) : (
             <div className="py-20 text-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Session Expired</p>
             </div>
          )}
        </div>

        {/* Security Module */}
        <div className={`${cardStyle} p-8 flex flex-col justify-between bg-slate-900 text-white border-slate-800`}>
          <div className="flex justify-between items-start">
             <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Security Audit</h4>
             <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          
          <div className="space-y-4">
             <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                   <Lock className="w-3.5 h-3.5 text-slate-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest">RSA-4096</span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed uppercase">
                   Your biometric data is encrypted at rest and in transit using hardware-level protocols.
                </p>
             </div>
             <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                Rotation Check
             </button>
          </div>
        </div>

        {/* Clinical Note Module - WIDE BOTTOM */}
        <div className={`${cardStyle} md:col-span-3 p-10 bg-slate-50 border border-slate-200/50 flex items-center gap-10`}>
           <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shrink-0">
              <Globe className="w-8 h-8 text-slate-300" />
           </div>
           <div>
              <h4 className={headerLabelStyle}>Information Integrity</h4>
              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
                To update your clinical information or medication history, please contact your healthcare provider. Records are immutable to ensure diagnostic integrity across the Healynx network.
              </p>
           </div>
           <button className="ml-auto flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">
              Legal Policy <ChevronRight className="w-4 h-4" />
           </button>
        </div>

      </div>
    </div>
  );
}

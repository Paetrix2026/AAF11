"use client";

import { getUserFromCookie } from "@/lib/auth";
import { Settings, User, Fingerprint, ShieldCheck, Lock } from "lucide-react";

export default function SettingsPage() {
  const user = getUserFromCookie();

  const cardStyle = "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50";
  const headerLabelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Settings className="w-3.5 h-3.5" />
            <span>Console Preferences Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Manage your clinical profile and system configurations.
          </p>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Account Details */}
        <div className={`${cardStyle} p-10 flex flex-col`}>
           <div className="mb-10">
              <h4 className={headerLabelStyle}>Identity</h4>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">User Profile</h3>
           </div>

           {user ? (
             <div className="space-y-6">
               {[
                 { label: "Full Name", value: user.name, icon: User },
                 { label: "Auth Identifier", value: user.email, icon: Fingerprint },
                 { label: "Privilege Level", value: user.role.toUpperCase(), icon: ShieldCheck },
               ].map(({ label, value, icon: Icon }) => (
                 <div key={label} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between group transition-all hover:bg-white">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-emerald-200 group-hover:text-emerald-500 transition-all">
                          <Icon className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{value}</p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="py-10 text-center bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Session Inactive</p>
             </div>
           )}
        </div>

        {/* System & Security */}
        <div className="space-y-6">
           <div className={`${cardStyle} p-10 bg-slate-900 text-white border-none`}>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                 <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Protocol Security</h4>
              <h3 className="text-xl font-bold mb-4">Encryption Active</h3>
              <p className="text-xs text-white/60 leading-relaxed font-medium">All clinical data is encrypted via AES-256 at rest and TLS 1.3 in transit. Your session is cryptographically signed.</p>
           </div>

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
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnostic Mode</span>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center px-1">
                       <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Latency UI</span>
                    <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center px-1">
                       <div className="w-3 h-3 bg-white rounded-full translate-x-5" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

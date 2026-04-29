"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPatients } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { Activity, Plus, Search, MapPin, Users, ShieldCheck, ChevronRight } from "lucide-react";
import type { Patient } from "@/types";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.location ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50";
  const headerLabelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Initialising Patient Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Users className="w-3.5 h-3.5" />
            <span>Patient Registry Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Patients</h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Diagnostic database of all registered clinical subjects.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Link
             href="/doctor/patients/new"
             className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3"
           >
             <Plus className="w-4 h-4" />
             <span>Add Patient</span>
           </Link>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-auto">
        
        {/* Search & Filters - TOP WIDE BLOCK */}
        <div className={`${cardStyle} lg:col-span-4 p-8 flex items-center gap-6`}>
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-emerald-500/50 transition-all"
              />
           </div>
           <div className="flex gap-2">
              <div className="px-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</span>
                 <span className="text-lg font-black text-slate-900">{patients.length}</span>
              </div>
              <div className="px-4 py-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Critical</span>
                 <span className="text-lg font-black text-red-600">{patients.filter(p => p.status === 'critical').length}</span>
              </div>
           </div>
        </div>

        {/* Patients List - MAIN MASSIVE BLOCK */}
        <div className={`${cardStyle} lg:col-span-4 flex flex-col`}>
           <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between">
                 <div>
                    <h4 className={headerLabelStyle}>Database</h4>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Registered Subjects</h3>
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Showing {filtered.length} of {patients.length} records
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Status</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Medication</th>
                    <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="p-20 text-center">
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No matching subjects found</p>
                       </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-all group">
                        <td className="p-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${
                                 p.status === 'critical' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                 {p.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {p.id.slice(0,8)}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-6">
                           <p className="text-[10px] font-bold text-slate-700 uppercase">{p.age || "—"} YRS • {p.gender || "—"}</p>
                           <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                              <MapPin className="w-3 h-3" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">{p.location || "N/A"}</span>
                           </div>
                        </td>
                        <td className="p-6">
                           <div className="flex">
                              <RiskBadge 
                                level={p.status === 'active' ? 'moderate' : p.status === 'critical' ? 'critical' : 'safe'} 
                                size="sm" 
                              />
                           </div>
                        </td>
                        <td className="p-6">
                           {p.medications.length > 0 ? (
                              <div>
                                 <p className="text-[10px] font-bold text-slate-700 uppercase">{p.medications[0].name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.medications[0].dose}</p>
                              </div>
                           ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">None</span>
                           )}
                        </td>
                        <td className="p-6 text-right">
                           <Link 
                             href={`/doctor/patients/${p.id}`} 
                             className="inline-flex h-9 px-4 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                           >
                             View Dossier
                           </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}

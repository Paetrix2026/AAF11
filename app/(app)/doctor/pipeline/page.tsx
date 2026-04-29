"use client";

import { useState, useEffect } from "react";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Search, User, ChevronRight, Activity, ShieldCheck, Zap, X, Filter, BarChart3, Clock, Database, Server } from "lucide-react";
import { getPatients } from "@/lib/api";
import { Patient } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function PipelinePage() {
  const [patientId, setPatientId] = useState("");
  const [started, setStarted] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatients().then(setPatients).finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === patientId);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 text-slate-900 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Diagnostic Node 0x7F</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Pipeline Engine</h1>
            <p className="text-slate-500 text-sm font-medium">Plan, prioritize, and execute clinical sequences with ease.</p>
          </div>
          
          <div className="flex items-center gap-3">
             {started && (
               <Button 
                 variant="ghost" 
                 onClick={() => setStarted(false)}
                 className="text-slate-400 hover:text-red-500 font-bold uppercase text-[10px] tracking-wider transition-all"
               >
                 Terminate Active Run
               </Button>
             )}
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
             </div>
          </div>
        </header>

        {!started ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,_auto)]">
            
            {/* MAIN BENTO CARD: Target Entry */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 fill-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Sequence Initiation</h2>
                    <p className="text-slate-400 text-xs font-medium">Establish target signature to begin synthesis</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end px-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Biological Target Identifier</Label>
                      {selectedPatient && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Registry Verified</span>}
                    </div>
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        value={patientId}
                        onChange={(e) => {
                          setPatientId(e.target.value);
                          setSearch(e.target.value);
                        }}
                        placeholder="Search subjects or enter explicit Project ID..."
                        className="pl-14 h-20 bg-slate-50/50 border-none rounded-[1.5rem] font-semibold text-lg focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all"
                      />
                      {patientId && (
                        <button 
                          onClick={() => { setPatientId(""); setSearch(""); }}
                          className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between gap-4">
                <div className="flex gap-2">
                   {[1,2,3].map(i => <div key={i} className="w-8 h-1.5 rounded-full bg-slate-100" />)}
                </div>
                <Button 
                  onClick={() => patientId.trim() && setStarted(true)} 
                  disabled={!patientId.trim()}
                  className="h-16 px-10 bg-emerald-500 text-white rounded-[1.25rem] font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Deploy Pipeline
                </Button>
              </div>
            </motion.div>

            {/* BENTO CARD: Registry Matches */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Filter className="w-4 h-4" />
                   </div>
                   <h3 className="font-bold text-sm tracking-tight">Registry matches</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                  {filteredPatients.length} FOUND
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
                  ))
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPatientId(p.id);
                        setSearch(p.name);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group/item ${
                        patientId === p.id 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          patientId === p.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover/item:bg-white"
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-xs">{p.name}</h4>
                          <p className={`text-[10px] font-medium opacity-60 ${patientId === p.id ? "text-white" : "text-slate-400"}`}>
                            ID: {p.id.slice(0, 12)}...
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-0 group-hover/item:opacity-100 transition-all ${patientId === p.id ? "text-white" : "text-slate-300"}`} />
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest px-4">No registry matches found</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* BENTO CARD: System Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/20 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-bold mb-1">98.4%</h3>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider opacity-80">Sequence Efficiency</p>
                <div className="mt-4 flex items-center gap-2">
                   <div className="px-2 py-1 bg-white/20 rounded-lg text-[9px] font-bold">+12% vs LAST RUN</div>
                </div>
              </div>
            </motion.div>

            {/* BENTO CARD: Node Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Server className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-slate-400">STABLE</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Node Cluster</h3>
                <p className="text-slate-400 text-xs font-medium">VINA_ENGINE_08 (Active)</p>
              </div>
            </motion.div>

            {/* BENTO CARD: Last Sync */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-4 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">Last Analysis</h3>
                <p className="text-slate-400 text-xs font-medium">Today, 14:20 PM</p>
              </div>
            </motion.div>

          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-50">
                <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="relative z-10 flex items-center gap-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
                      <div className="relative w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-500/40">
                         <Activity className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Computational Active</h2>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIG_HASH:</span>
                         <span className="font-mono text-xs text-emerald-400 font-bold">{patientId.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative z-10 text-center md:text-right">
                    <div className="flex items-center gap-2 justify-center md:justify-end mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Streaming Live</p>
                    </div>
                    <p className="text-xl font-bold text-slate-300">NODE_CLUSTER_BRAVO</p>
                  </div>
                </div>
                
                <div className="p-0">
                  <PipelineRunner patientId={patientId} />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footer */}
        <footer className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 opacity-40">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                 <Database className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">NEON_DB_V4</span>
              </div>
              <div className="flex items-center gap-2">
                 <Zap className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">VINA_ENGINE_08</span>
              </div>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 HEALYNX SYSTEMS • SECURE CLINICAL INTERFACE</p>
        </footer>
      </div>
    </div>
  );
}

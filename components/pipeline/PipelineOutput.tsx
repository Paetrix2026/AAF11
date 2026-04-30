"use client";

import { RiskBadge } from "@/components/shared/RiskBadge";
import { UrgencyIndicator } from "@/components/shared/UrgencyIndicator";
import type { PipelineResult } from "@/types";
import { Pill, Activity, History, Microscope, AlertCircle, TrendingUp, Info, ChevronRight, Binary, ShieldCheck, Share2, Download, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface PipelineOutputProps {
  result: PipelineResult;
}

export function PipelineOutput({ result }: PipelineOutputProps) {
  const cardStyle = "bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50";
  const labelStyle = "flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6";

  return (
    <div className="p-8 lg:p-12 space-y-8 bg-slate-50/50">
      
      {/* HEADER BENTO: Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-all group-hover:bg-emerald-500/10" />
          
          <div className="relative z-10 space-y-10">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Pill className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-400 uppercase tracking-wider">Primary Therapeutic Option</span>
               </div>
               <div className="flex gap-2">
                  <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"><Share2 className="w-4 h-4" /></button>
                  <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"><Download className="w-4 h-4" /></button>
               </div>
            </div>

            <div>
              <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6">
                {result.primaryDrug}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/20">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {Math.round(result.primaryConfidence || 0)}% Confidence
                 </div>
                 <RiskBadge level={result.riskLevel} />
                 <UrgencyIndicator urgency={result.urgency} />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50">
               <p className="text-lg font-medium leading-relaxed text-slate-700 italic">
                 "{result.doctorSummary}"
               </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4"
        >
          <div className={`${cardStyle} h-full flex flex-col justify-between relative overflow-hidden group`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                   <AlertCircle className="w-4 h-4" /> Required Action
                </div>
                
                {/* Molecular Structure Visualization */}
                <div className="my-6 aspect-square w-full bg-slate-50/50 rounded-[2rem] border border-slate-100 flex items-center justify-center relative overflow-hidden p-6 group-hover:bg-white transition-all">
                   {result.smiles ? (
                     <img 
                       src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(result.smiles)}/PNG`} 
                       alt="Molecular Structure"
                       onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         if (!target.src.includes('cactus')) {
                            target.src = `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(result.smiles || '')}/image`;
                         }
                       }}
                       className="max-w-full max-h-full mix-blend-multiply opacity-80 group-hover:opacity-100 transition-all scale-110 group-hover:scale-125 duration-700"
                     />
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-slate-300">
                        <Microscope className="w-8 h-8 opacity-20" />
                        <span className="text-[8px] font-bold uppercase tracking-widest">Structure Data Pending</span>
                     </div>
                   )}
                   <div className="absolute bottom-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                      <Binary className="w-3 h-3 text-emerald-500" />
                   </div>
                </div>

                <p className="text-xl font-bold leading-tight text-slate-900">
                   {result.actionRequired || "Maintain current observation sequence."}
                </p>
             </div>

             <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-slate-400 font-bold uppercase tracking-wider">Resistance Risk</span>
                   <span className={`font-black uppercase text-[10px] ${
                     result.primaryResistanceRisk === 'high' ? 'text-red-500' : 
                     result.primaryResistanceRisk === 'moderate' ? 'text-amber-500' : 'text-emerald-500'
                   }`}>{result.primaryResistanceRisk}</span>
                </div>
                <div className="flex justify-between items-start text-xs gap-4">
                   <span className="text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">Alternative</span>
                   <span className="font-bold text-slate-700 text-right break-words max-w-[200px] leading-tight">
                      {result.alternativeDrug || "None Identified"}
                   </span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Resistance Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cardStyle}
        >
          <div className={labelStyle}>
            <Activity className="w-3 h-3" /> Pathogen Resistance
          </div>
          <div className="space-y-6">
            {Object.entries(result.resistanceScores || {}).slice(0, 4).map(([drug, score]) => (
              <div key={drug} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-xs text-slate-700">{drug}</span>
                  <span className="text-[10px] font-bold text-slate-400">{Math.round((score || 0) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(score || 0) * 100}%` }}
                     className={`h-full rounded-full ${
                       (score || 0) > 0.7 ? "bg-red-500" : (score || 0) > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                     }`}
                   />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ADMET Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cardStyle}
        >
          <div className={labelStyle}>
            <Microscope className="w-3 h-3" /> ADMET Properties
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(result.admetScores || {})
              .filter(([key]) => ["absorption", "distribution", "metabolism", "excretion", "toxicity"].includes(key))
              .slice(0, 6).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                    (val || 0) > 0.7 ? "bg-white text-emerald-600 shadow-sm" : 
                    (val || 0) > 0.4 ? "bg-white text-amber-600 shadow-sm" : "bg-white text-red-600 shadow-sm"
                  }`}>
                    {Math.round((val || 0) * 100)}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter text-center group-hover:text-emerald-600">{key}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardStyle} flex flex-col justify-between`}
        >
          <div className={labelStyle}>
            <Info className="w-3 h-3" /> Molecular Specs
          </div>
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mol-Weight</span>
                <span className="font-bold text-slate-900">{result.admetScores?.mw?.toFixed(1) || "N/A"} Da</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">LogP Value</span>
                <span className="font-bold text-slate-900">{result.admetScores?.logP?.toFixed(2) || "N/A"}</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Surface Area</span>
                <span className="font-bold text-slate-900">{result.admetScores?.tpsa?.toFixed(1) || "N/A"} Å²</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* DOCKING BENTO: Wide Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cardStyle}
      >
        <div className={labelStyle}>
          <Binary className="w-3 h-3" /> Molecular Docking Vector analysis
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                <th className="pb-4 px-2">Compound Identifier</th>
                <th className="pb-4 px-2 text-center">Affinity</th>
                <th className="pb-4 px-2">Binding Efficiency</th>
                <th className="pb-4 px-2 text-right">Sequence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(result.dockingResults || []).map((r, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-2">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white transition-all">
                           <Pill className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{r.name}</span>
                     </div>
                  </td>
                  <td className="py-5 px-2 text-center">
                    <span className={`font-bold text-sm ${
                      (r.affinity ?? 0) < -7 ? "text-emerald-500" : (r.affinity ?? 0) < -5 ? "text-amber-500" : "text-slate-400"
                    }`}>
                      {r.affinity ? `${r.affinity.toFixed(1)}` : "N/A"}
                    </span>
                  </td>
                  <td className="py-5 px-2">
                     <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${Math.min(100, Math.abs(r.affinity || 0) * 10)}%` }} />
                     </div>
                  </td>
                  <td className="py-5 px-2 text-right">
                     <div className="flex items-center justify-end gap-2 text-[10px] font-medium text-slate-400">
                        <span className="truncate max-w-[120px] font-mono">{r.smiles}</span>
                        <ExternalLink className="w-3 h-3" />
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* HISTORY BENTO: Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Historical Cohort matches</h4>
           </div>
           <button className="text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-widest">View Database</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {(result.similarCases || []).map((c, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="p-6 bg-white rounded-3xl shadow-sm border border-slate-50 flex flex-col justify-between gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                 <div className="space-y-4">
                    <div className="flex justify-between items-start">
                       <span className="font-mono text-[9px] font-bold text-slate-300">REF_{c.caseId.slice(0,6)}</span>
                       <div className={`w-2 h-2 rounded-full ${c.outcome === 'effective' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                    <h5 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">{c.drug}</h5>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{c.date}</span>
                    <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{c.outcome}</span>
                 </div>
              </motion.div>
           ))}
        </div>
      </div>

      <div className="py-10 text-center">
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] flex items-center justify-center gap-4">
            <ShieldCheck className="w-4 h-4" /> Healynx Clinical Cluster 0xFA • Verified Sequence
         </p>
      </div>
    </div>
  );
}

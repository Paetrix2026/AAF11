"use client";

import { motion } from "framer-motion";
import type { AgentStep } from "@/types";
import { Check, Loader2, AlertTriangle, Circle, ArrowRight } from "lucide-react";

interface AgentStepCardProps {
  step: AgentStep;
  index: number;
}

const AGENT_COLORS: Record<string, string> = {
  FetchAgent: "#10b981", // Emerald
  MutationParserAgent: "#10b981",
  StructurePrepAgent: "#3b82f6", // Blue
  DockingAgent: "#3b82f6",
  ADMETAgent: "#f59e0b", // Amber
  ResistanceAgent: "#f59e0b",
  SelectivityAgent: "#8b5cf6", // Violet
  SimilaritySearchAgent: "#8b5cf6",
  DecisionAgent: "#8b5cf6",
  SimulationAgent: "#8b5cf6",
  ExplainabilityAgent: "#ec4899", // Pink
  ReportAgent: "#ec4899",
  PlannerAgent: "#64748b", // Slate
};

const AGENT_LABELS: Record<string, string> = {
  FetchAgent: "NCBI Data Fetch",
  MutationParserAgent: "Sequence Align",
  StructurePrepAgent: "3D Folding",
  DockingAgent: "Binding Analysis",
  ADMETAgent: "Drug Properties",
  ResistanceAgent: "Mutation Risk",
  SelectivityAgent: "Selectivity",
  SimilaritySearchAgent: "Case Match",
  DecisionAgent: "Therapeutic Ranking",
  SimulationAgent: "Clinical Simulation",
  ExplainabilityAgent: "Decision Logic",
  ReportAgent: "Final Synthesis",
  PlannerAgent: "Orchestration",
};

export function AgentStepCard({ step, index }: AgentStepCardProps) {
  const color = AGENT_COLORS[step.agentName] ?? "#64748b";
  const label = AGENT_LABELS[step.agentName] ?? step.agentName;
  const isActive = step.status === "running";
  const isComplete = step.status === "complete";
  const isFailed = step.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`relative group bg-white p-5 rounded-3xl shadow-sm border border-slate-50 transition-all ${
        isActive ? "ring-2 ring-emerald-500/20 bg-emerald-50/10 shadow-lg shadow-emerald-500/5" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Icon Unit */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : 
          isComplete ? "bg-slate-900 text-emerald-400" :
          isFailed ? "bg-red-500 text-white" : "bg-slate-50 text-slate-300"
        }`}>
          {isActive ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isComplete ? (
            <Check className="w-5 h-5" />
          ) : isFailed ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Circle className="w-2 h-2 fill-current" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className={`text-xs font-bold tracking-tight truncate ${
              isActive ? "text-emerald-600" : "text-slate-900"
            }`}>
              {label}
            </h4>
            <div className={`w-1.5 h-1.5 rounded-full ${
               isActive ? "bg-emerald-500 animate-pulse" :
               isComplete ? "bg-emerald-400" :
               isFailed ? "bg-red-500" : "bg-slate-100"
            }`} />
          </div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {step.status}
          </p>
        </div>
      </div>

      {step.message && (
        <div className="mt-4 pt-4 border-t border-slate-50">
           <p className="text-[10px] font-semibold text-slate-500 leading-relaxed italic line-clamp-2">
              "{step.message}"
           </p>
        </div>
      )}

      {/* Detail Arrow (Hover) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
         <ArrowRight className="w-3 h-3 text-slate-300" />
      </div>
    </motion.div>
  );
}

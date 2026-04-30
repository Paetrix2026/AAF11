"use client";

import { motion } from "framer-motion";
import type { AgentStep } from "@/types";
import { Check, Loader2, AlertTriangle, Clock, ArrowRight } from "lucide-react";

interface AgentStepCardProps {
  step: AgentStep;
  index: number;
}

const AGENT_META: Record<
  string,
  { label: string; sublabel: string; color: string; bg: string }
> = {
  PlannerAgent: {
    label: "Orchestration",
    sublabel: "Pipeline planning & scheduling",
    color: "#64748b",
    bg: "bg-slate-100",
  },
  FetchAgent: {
    label: "NCBI Data Fetch",
    sublabel: "Genomic sequence retrieval",
    color: "#10b981",
    bg: "bg-emerald-100",
  },
  MutationParserAgent: {
    label: "Sequence Alignment",
    sublabel: "MAFFT mutation extraction",
    color: "#10b981",
    bg: "bg-emerald-100",
  },
  StructurePrepAgent: {
    label: "3D Folding",
    sublabel: "PDB structure preparation",
    color: "#3b82f6",
    bg: "bg-blue-100",
  },
  DockingAgent: {
    label: "Binding Analysis",
    sublabel: "AutoDock Vina screening",
    color: "#3b82f6",
    bg: "bg-blue-100",
  },
  ADMETAgent: {
    label: "Drug Properties",
    sublabel: "RDKit ADMET computation",
    color: "#f59e0b",
    bg: "bg-amber-100",
  },
  ResistanceAgent: {
    label: "Mutation Risk",
    sublabel: "Resistance probability scoring",
    color: "#f59e0b",
    bg: "bg-amber-100",
  },
  SelectivityAgent: {
    label: "Selectivity",
    sublabel: "Off-target binding check",
    color: "#8b5cf6",
    bg: "bg-violet-100",
  },
  SimilaritySearchAgent: {
    label: "Case Match",
    sublabel: "Historical case retrieval",
    color: "#8b5cf6",
    bg: "bg-violet-100",
  },
  DecisionAgent: {
    label: "Therapeutic Ranking",
    sublabel: "Multi-criteria drug ranking",
    color: "#6366f1",
    bg: "bg-indigo-100",
  },
  SimulationAgent: {
    label: "Clinical Simulation",
    sublabel: "Stability & outcome prediction",
    color: "#6366f1",
    bg: "bg-indigo-100",
  },
  ExplainabilityAgent: {
    label: "Decision Logic",
    sublabel: "LLM clinical synthesis",
    color: "#ec4899",
    bg: "bg-pink-100",
  },
  ReportAgent: {
    label: "Final Synthesis",
    sublabel: "Structured report compilation",
    color: "#ec4899",
    bg: "bg-pink-100",
  },
};

export function AgentStepCard({ step, index }: AgentStepCardProps) {
  const meta = AGENT_META[step.agentName] ?? {
    label: step.agentName,
    sublabel: "Agent processing",
    color: "#64748b",
    bg: "bg-slate-100",
  };

  const isActive = step.status === "running";
  const isComplete = step.status === "complete";
  const isFailed = step.status === "failed";
  const isPending = step.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
      className={`relative group flex flex-col gap-5 p-7 rounded-[2rem] border transition-all duration-500 ${
        isActive
          ? "bg-white border-emerald-300 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20"
          : isComplete
            ? "bg-emerald-50/60 border-emerald-200 shadow-lg shadow-emerald-500/10"
            : isFailed
              ? "bg-red-50/60 border-red-200 shadow-md"
              : "bg-slate-50/50 border-slate-100 opacity-55"
      }`}
    >
      {/* Top row: icon + status dot */}
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 ${
            isActive
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
              : isComplete
                ? "bg-emerald-500 shadow-md shadow-emerald-500/25"
                : isFailed
                  ? "bg-red-500"
                  : meta.bg
          }`}
        >
          {isActive ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isComplete ? (
            <Check className="w-6 h-6 text-emerald-400" />
          ) : isFailed ? (
            <AlertTriangle className="w-6 h-6 text-white" />
          ) : (
            <Clock
              className="w-6 h-6"
              style={{ color: meta.color, opacity: 0.5 }}
            />
          )}
        </div>

        {/* Status dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1 ${
            isActive
              ? "bg-emerald-500 animate-pulse"
              : isComplete
                ? "bg-emerald-400"
                : isFailed
                  ? "bg-red-400"
                  : "bg-slate-200"
          }`}
        />
      </div>

      {/* Labels */}
      <div className="space-y-1">
        <h4
          className={`text-sm font-black tracking-tight leading-tight ${
            isActive
              ? "text-emerald-700"
              : isComplete
                ? "text-emerald-800"
                : isFailed
                  ? "text-red-700"
                  : "text-slate-400"
          }`}
        >
          {meta.label}
        </h4>
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.18em] ${
            isComplete ? "text-emerald-600/70" : "text-slate-400"
          }`}
        >
          {meta.sublabel}
        </p>
      </div>

      {/* Status pill */}
      <div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            isActive
              ? "bg-emerald-100 text-emerald-700"
              : isComplete
                ? "bg-slate-100 text-slate-600"
                : isFailed
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-400"
          }`}
        >
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {step.status}
        </span>
      </div>

      {/* Message */}
      {step.message && (
        <div
          className={`pt-4 border-t ${
            isComplete ? "border-emerald-100" : "border-slate-100"
          }`}
        >
          <p
            className={`text-[11px] font-medium leading-relaxed italic line-clamp-3 ${
              isComplete ? "text-emerald-700/70" : "text-slate-500"
            }`}
          >
            "{step.message}"
          </p>
        </div>
      )}

      {/* Hover arrow */}
      {isComplete && (
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all">
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}

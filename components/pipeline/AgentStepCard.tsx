"use client";

import { motion } from "framer-motion";
import type { AgentStep } from "@/types";

interface AgentStepCardProps {
  step: AgentStep;
  index: number;
}

const AGENT_COLORS: Record<string, string> = {
  FetchAgent: "var(--agent-surveillance)",
  MutationParserAgent: "var(--agent-surveillance)",
  StructurePrepAgent: "var(--agent-discovery)",
  DockingAgent: "var(--agent-discovery)",
  ADMETAgent: "var(--agent-resistance)",
  ResistanceAgent: "var(--agent-resistance)",
  SelectivityAgent: "var(--agent-memory)",
  SimilaritySearchAgent: "var(--agent-memory)",
  ExplainabilityAgent: "var(--agent-nextstep)",
  ReportAgent: "var(--agent-nextstep)",
  PlannerAgent: "var(--text-muted)",
};

const AGENT_LABELS: Record<string, string> = {
  FetchAgent: "Surveillance Agent",
  MutationParserAgent: "Mutation Parser",
  StructurePrepAgent: "Structure Prep",
  DockingAgent: "Docking Agent",
  ADMETAgent: "ADMET Analysis",
  ResistanceAgent: "Resistance Agent",
  SelectivityAgent: "Selectivity Agent",
  SimilaritySearchAgent: "Memory Agent",
  ExplainabilityAgent: "Next Step Engine",
  ReportAgent: "Report Generator",
  PlannerAgent: "Planner",
};

export function AgentStepCard({ step, index }: AgentStepCardProps) {
  const color = AGENT_COLORS[step.agentName] ?? "var(--text-muted)";
  const label = AGENT_LABELS[step.agentName] ?? step.agentName;
  const isActive = step.status === "running";
  const isComplete = step.status === "complete";
  const isFailed = step.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: "0.75rem 1rem",
        background: isActive ? `${color}08` : "transparent",
        border: isActive ? `1px solid ${color}30` : "1px solid transparent",
        borderLeft: `3px solid ${isComplete ? color : isActive ? color : "var(--bg-border)"}`,
        transition: "all 0.3s",
      }}
      className={isActive ? "agent-active" : ""}
    >
      {/* Status dot */}
      <div style={{ paddingTop: "2px", flexShrink: 0 }}>
        {isFailed ? (
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "var(--risk-critical)",
            }}
          />
        ) : isComplete ? (
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: color,
            }}
          />
        ) : isActive ? (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: color,
            }}
          />
        ) : (
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "var(--bg-border)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              color: isActive || isComplete ? color : "var(--text-muted)",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </span>
          {(isActive || isComplete || isFailed) && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.5625rem",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
              }}
            >
              {isActive ? "RUNNING" : isComplete ? "DONE" : "FAILED"}
            </span>
          )}
        </div>
        {step.message && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              marginTop: "0.25rem",
            }}
          >
            {step.message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

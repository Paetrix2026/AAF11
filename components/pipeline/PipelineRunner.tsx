"use client";

import { useState, useRef } from "react";
import { runPipeline, streamPipeline, submitOutcome } from "@/lib/api";
import { AgentStepCard } from "./AgentStepCard";
import { PipelineOutput } from "./PipelineOutput";
import { UrgencyIndicator } from "@/components/shared/UrgencyIndicator";
import type { AgentStep, PipelineResult } from "@/types";

interface PipelineRunnerProps {
  patientId: string;
}

const AGENT_SEQUENCE = [
  "PlannerAgent",
  "FetchAgent",
  "MutationParserAgent",
  "StructurePrepAgent",
  "DockingAgent",
  "ADMETAgent",
  "ResistanceAgent",
  "SelectivityAgent",
  "SimilaritySearchAgent",
  "ExplainabilityAgent",
  "ReportAgent",
];

export function PipelineRunner({ patientId }: PipelineRunnerProps) {
  const [pathogen, setPathogen] = useState("");
  const [variant, setVariant] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"effective" | "partial" | "failed" | "">("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [outcomeSubmitted, setOutcomeSubmitted] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const handleRun = async () => {
    if (!pathogen.trim()) {
      setError("Please enter a pathogen or variant.");
      return;
    }
    setError("");
    setRunning(true);
    setSteps([]);
    setResult(null);
    setOutcome("");
    setOutcomeSubmitted(false);

    // Initialize steps as pending
    const initialSteps: AgentStep[] = AGENT_SEQUENCE.map((name) => ({
      agentName: name,
      status: "pending",
      message: "",
    }));
    setSteps(initialSteps);

    try {
      const res = await runPipeline({
        patientId,
        pathogen: pathogen.trim(),
        variant: variant.trim() || undefined,
        symptoms: symptoms
          ? symptoms
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      });
      setRunId(res.runId);

      // Stream SSE updates
      esRef.current = streamPipeline(res.runId, (rawData) => {
        try {
          const update = JSON.parse(rawData) as {
            agent?: string;
            status?: string;
            message?: string;
            result?: PipelineResult;
            done?: boolean;
          };

          if (update.done && update.result) {
            setResult(update.result);
            setRunning(false);
            esRef.current?.close();
            return;
          }

          if (update.agent) {
            setSteps((prev) =>
              prev.map((s) =>
                s.agentName === update.agent
                  ? {
                      ...s,
                      status: (update.status as AgentStep["status"]) ?? "running",
                      message: update.message ?? s.message,
                    }
                  : s
              )
            );
          }
        } catch {
          // non-JSON SSE message, ignore
        }
      });

      esRef.current.onerror = () => {
        setRunning(false);
        esRef.current?.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start pipeline.");
      setRunning(false);
    }
  };

  const handleSubmitOutcome = async () => {
    if (!outcome || !runId) return;
    try {
      await submitOutcome(runId, outcome, outcomeNotes);
      setOutcomeSubmitted(true);
    } catch {
      // Could show toast here
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.625rem 0.75rem",
    background: "var(--bg-elevated)",
    border: "1px solid var(--bg-border)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle = {
    display: "block" as const,
    fontFamily: "var(--font-display)",
    fontSize: "0.5625rem",
    color: "var(--text-muted)",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    marginBottom: "0.375rem",
  };

  return (
    <div>
      {/* Input form */}
      {!running && !result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>Pathogen / Variant</label>
            <input
              type="text"
              value={pathogen}
              onChange={(e) => setPathogen(e.target.value)}
              placeholder="e.g. H5N1, SARS-CoV-2 BA.2.86..."
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Variant (optional)</label>
            <input
              type="text"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g. T271A"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Symptoms (comma separated)</label>
            <input
              type="text"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="fever, cough, fatigue..."
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--risk-critical)",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleRun}
            style={{
              padding: "0.875rem",
              background: "var(--accent-primary)",
              color: "#0a0b0d",
              fontFamily: "var(--font-display)",
              fontSize: "0.875rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            RUN ANALYSIS
          </button>
        </div>
      )}

      {/* Pipeline steps visualization */}
      {(running || result) && steps.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.5625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Pipeline Steps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {steps.map((step, idx) => (
              <AgentStepCard key={step.agentName} step={step} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Running indicator */}
      {running && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem",
            background: "rgba(0,229,195,0.05)",
            border: "1px solid rgba(0,229,195,0.2)",
          }}
        >
          <div
            className="agent-active"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent-primary)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              color: "var(--accent-primary)",
              letterSpacing: "0.08em",
            }}
          >
            ANALYSIS IN PROGRESS...
          </span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <PipelineOutput result={result} />

          {/* Outcome submission */}
          {!outcomeSubmitted ? (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.5625rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.15em",
                  marginBottom: "0.75rem",
                }}
              >
                RECORD OUTCOME
              </div>
              <div
                style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
              >
                {(["effective", "partial", "failed"] as const).map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => setOutcome(o)}
                    style={{
                      padding: "0.375rem 0.875rem",
                      background:
                        outcome === o ? "rgba(0,229,195,0.15)" : "transparent",
                      border:
                        outcome === o
                          ? "1px solid var(--accent-primary)"
                          : "1px solid var(--bg-border)",
                      color:
                        outcome === o ? "var(--accent-primary)" : "var(--text-muted)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.625rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Clinical notes (optional)..."
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "0.75rem",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--bg-border)",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleSubmitOutcome}
                  disabled={!outcome}
                  style={{
                    padding: "0.5rem 1rem",
                    background: outcome ? "var(--accent-primary)" : "var(--bg-border)",
                    color: outcome ? "#0a0b0d" : "var(--text-muted)",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.625rem",
                    letterSpacing: "0.08em",
                    cursor: outcome ? "pointer" : "not-allowed",
                  }}
                >
                  ✓ SUBMIT OUTCOME
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setSteps([]);
                    setRunId(null);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "transparent",
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.625rem",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  NEW ANALYSIS
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.3)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.75rem",
                  color: "var(--risk-safe)",
                  letterSpacing: "0.08em",
                }}
              >
                ✓ OUTCOME RECORDED
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

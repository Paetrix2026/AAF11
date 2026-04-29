"use client";

import { useState } from "react";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";

export default function PipelinePage() {
  const [patientId, setPatientId] = useState("");
  const [started, setStarted] = useState(false);

  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          color: "var(--text-primary)",
          letterSpacing: "0.05em",
          marginBottom: "1.75rem",
        }}
      >
        RUN ANALYSIS
      </h1>

      {!started ? (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontSize: "0.5625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "0.375rem",
            }}
          >
            Patient ID
          </label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter patient UUID..."
            style={{
              width: "100%",
              padding: "0.625rem 0.75rem",
              marginBottom: "0.75rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--bg-border)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => patientId.trim() && setStarted(true)}
            disabled={!patientId.trim()}
            style={{
              padding: "0.625rem 1.25rem",
              background: patientId.trim() ? "var(--accent-primary)" : "var(--bg-border)",
              color: patientId.trim() ? "#0a0b0d" : "var(--text-muted)",
              border: "none",
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              cursor: patientId.trim() ? "pointer" : "not-allowed",
            }}
          >
            CONTINUE
          </button>
          <p
            style={{
              marginTop: "0.75rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
            }}
          >
            Tip: Navigate to a patient's page to run analysis directly.
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <PipelineRunner patientId={patientId} />
        </div>
      )}
    </div>
  );
}

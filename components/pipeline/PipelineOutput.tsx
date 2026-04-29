"use client";

import { RiskBadge } from "@/components/shared/RiskBadge";
import { UrgencyIndicator } from "@/components/shared/UrgencyIndicator";
import type { PipelineResult } from "@/types";

interface PipelineOutputProps {
  result: PipelineResult;
}

export function PipelineOutput({ result }: PipelineOutputProps) {
  const sectionLabel = {
    fontFamily: "var(--font-display)" as const,
    fontSize: "0.5625rem",
    color: "var(--text-muted)",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    marginBottom: "0.75rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Main recommendation */}
      <div
        style={{
          padding: "1.25rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          borderLeft: `4px solid ${
            result.riskLevel === "critical"
              ? "var(--risk-critical)"
              : result.riskLevel === "high"
                ? "var(--risk-high)"
                : "var(--risk-moderate)"
          }`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            RECOMMENDATION
          </span>
          <RiskBadge level={result.riskLevel} />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              marginBottom: "0.375rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--text-primary)",
              }}
            >
              {result.primaryDrug}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.6875rem",
                color: "var(--accent-primary)",
              }}
            >
              {result.primaryConfidence}% CONFIDENCE
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              Resistance: {result.primaryResistanceRisk}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
            }}
          >
            Alternative:{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {result.alternativeDrug}
            </strong>{" "}
            — {result.alternativeConfidence}% confidence
          </div>
        </div>

        <UrgencyIndicator urgency={result.urgency} />

        <div
          style={{
            marginTop: "0.875rem",
            padding: "0.75rem",
            background: "var(--bg-surface)",
            borderLeft: "2px solid var(--bg-border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            {result.doctorSummary}
          </p>
        </div>

        {result.actionRequired && (
          <div
            style={{
              marginTop: "0.75rem",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--text-accent)",
            }}
          >
            → {result.actionRequired}
          </div>
        )}
      </div>

      {/* Resistance scores */}
      {result.resistanceScores &&
        Object.keys(result.resistanceScores).length > 0 && (
          <div
            style={{
              padding: "1.25rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <div style={sectionLabel}>Resistance Profile</div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              {Object.entries(result.resistanceScores).map(([drug, score]) => (
                <div
                  key={drug}
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      width: "140px",
                      flexShrink: 0,
                    }}
                  >
                    {drug}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "6px",
                      background: "var(--bg-elevated)",
                      borderRadius: "1px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${score * 100}%`,
                        background:
                          score > 0.7
                            ? "var(--risk-critical)"
                            : score > 0.4
                              ? "var(--risk-moderate)"
                              : "var(--risk-safe)",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.6875rem",
                      color: "var(--text-muted)",
                      width: "3rem",
                      textAlign: "right",
                    }}
                  >
                    {Math.round(score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Similar cases */}
      {result.similarCases && result.similarCases.length > 0 && (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <div style={sectionLabel}>Similar Historical Cases</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Case ID", "Drug", "Outcome", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.5625rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      textAlign: "left",
                      padding: "0.25rem 0.5rem",
                      borderBottom: "1px solid var(--bg-border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.similarCases.map((c) => (
                <tr key={c.caseId}>
                  <td
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      padding: "0.375rem 0.5rem",
                    }}
                  >
                    {c.caseId}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--text-primary)",
                      padding: "0.375rem 0.5rem",
                    }}
                  >
                    {c.drug}
                  </td>
                  <td style={{ padding: "0.375rem 0.5rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.625rem",
                        color:
                          c.outcome === "effective"
                            ? "var(--risk-safe)"
                            : c.outcome === "partial"
                              ? "var(--risk-moderate)"
                              : "var(--risk-critical)",
                      }}
                    >
                      {c.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.6875rem",
                      color: "var(--text-muted)",
                      padding: "0.375rem 0.5rem",
                    }}
                  >
                    {c.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADMET scores */}
      {result.admetScores && (
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <div style={sectionLabel}>ADMET Properties</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "1rem",
            }}
          >
            {(
              [
                "absorption",
                "distribution",
                "metabolism",
                "excretion",
                "toxicity",
              ] as const
            ).map((key) => {
              const val = result.admetScores?.[key] ?? 0;
              return (
                <div key={key} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1rem",
                      color:
                        val > 0.7
                          ? "var(--risk-safe)"
                          : val > 0.4
                            ? "var(--risk-moderate)"
                            : "var(--risk-critical)",
                    }}
                  >
                    {Math.round(val * 100)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.5rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginTop: "0.25rem",
                    }}
                  >
                    {key.slice(0, 1).toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        Healynx assists clinical decision-making and does not replace
        professional medical judgment.
      </p>
    </div>
  );
}

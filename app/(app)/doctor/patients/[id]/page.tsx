"use client";

import { use, useEffect, useState } from "react";
import { getPatient } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPatient(id)
      .then(setPatient)
      .catch(() => setError("Patient not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--accent-primary)",
            fontSize: "0.875rem",
            letterSpacing: "0.1em",
          }}
        >
          LOADING PATIENT...
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ padding: "2rem" }}>
        <div
          style={{
            padding: "2rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--risk-critical)",
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
            }}
          >
            {error || "PATIENT NOT FOUND"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            letterSpacing: "0.05em",
          }}
        >
          {patient.name}
        </h1>
        <RiskBadge
          level={
            patient.status === "critical"
              ? "critical"
              : patient.status === "active"
                ? "moderate"
                : "safe"
          }
        />
      </div>

      {/* Two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left — Patient Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Demographics */}
          <div
            style={{
              padding: "1.25rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.5625rem",
                color: "var(--text-muted)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Patient Profile
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                { label: "Age", value: patient.age ? `${patient.age} years` : "—" },
                { label: "Gender", value: patient.gender ?? "—" },
                { label: "Location", value: patient.location ?? "—" },
                {
                  label: "Patient Since",
                  value: patient.createdAt ? formatDate(patient.createdAt) : "—",
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.5rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div
            style={{
              padding: "1.25rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
            }}
          >
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
              Comorbidities
            </div>
            {patient.conditions.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                None recorded
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {patient.conditions.map((c) => (
                  <span
                    key={c}
                    style={{
                      padding: "0.25rem 0.625rem",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--bg-border)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                      borderRadius: "2px",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div
            style={{
              padding: "1.25rem",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-border)",
            }}
          >
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
              Current Medications
            </div>
            {patient.medications.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                }}
              >
                None prescribed
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}
              >
                {patient.medications.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.625rem 0.75rem",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--bg-border)",
                      borderLeft: "2px solid var(--accent-primary)",
                    }}
                  >
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
                          fontSize: "0.8125rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {med.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.75rem",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {med.dose}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "0.25rem",
                      }}
                    >
                      Since {med.since}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Pipeline Runner */}
        <div
          style={{
            padding: "1.25rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.5625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            AI Analysis Pipeline
          </div>
          <PipelineRunner patientId={id} />
        </div>
      </div>
    </div>
  );
}

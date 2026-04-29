"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPatients } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
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

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          PATIENTS
        </h1>
        <Link
          href="/doctor/patients/new"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--accent-primary)",
            color: "#0a0b0d",
            fontFamily: "var(--font-display)",
            fontSize: "0.75rem",
            fontWeight: "700",
            letterSpacing: "0.08em",
            textDecoration: "none",
          }}
        >
          + ADD PATIENT
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search patients by name or location..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          outline: "none",
          marginBottom: "1.5rem",
        }}
      />

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            fontFamily: "var(--font-display)",
            color: "var(--accent-primary)",
            fontSize: "0.875rem",
            letterSpacing: "0.1em",
          }}
        >
          LOADING...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
            }}
          >
            {patients.length === 0 ? "NO PATIENTS YET" : "NO RESULTS FOUND"}
          </p>
          {patients.length === 0 && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
                marginTop: "0.5rem",
              }}
            >
              Add your first patient to get started.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 100px",
              padding: "0.5rem 1rem",
              fontFamily: "var(--font-display)",
              fontSize: "0.5625rem",
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--bg-border)",
            }}
          >
            <span>Name</span>
            <span>Age / Gender</span>
            <span>Location</span>
            <span>Current Medication</span>
            <span>Status</span>
            <span />
          </div>
          {filtered.map((patient) => (
            <div
              key={patient.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1.5fr 1fr 100px",
                padding: "0.875rem 1rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-border)",
                alignItems: "center",
                borderLeft:
                  patient.status === "critical"
                    ? "2px solid var(--risk-critical)"
                    : "2px solid transparent",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {patient.name}
                </div>
                {patient.conditions.length > 0 && (
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "0.125rem",
                    }}
                  >
                    {patient.conditions.slice(0, 2).join(", ")}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                }}
              >
                {patient.age ?? "—"} / {patient.gender ?? "—"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                }}
              >
                {patient.location ?? "—"}
              </div>
              <div>
                {patient.medications.length > 0 ? (
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8125rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {patient.medications[0].name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {patient.medications[0].dose}
                    </div>
                  </div>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    None
                  </span>
                )}
              </div>
              <div>
                <RiskBadge
                  level={
                    patient.status === "active"
                      ? "moderate"
                      : patient.status === "critical"
                        ? "critical"
                        : "safe"
                  }
                  size="sm"
                />
              </div>
              <div>
                <Link
                  href={`/doctor/patients/${patient.id}`}
                  style={{
                    display: "inline-block",
                    padding: "0.3125rem 0.75rem",
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.08em",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  VIEW →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { getPatients, getAlerts, getPipelineRuns } from "@/lib/api";
import { getUserFromCookie } from "@/lib/auth";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import type { Alert, Patient, PipelineRun, User } from "@/types";

export default function DoctorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUserFromCookie());
    Promise.all([
      getPatients().catch(() => [] as Patient[]),
      getAlerts().catch(() => [] as Alert[]),
      getPipelineRuns().catch(() => [] as PipelineRun[]),
    ]).then(([p, a, r]) => {
      setPatients(p);
      setAlerts(a);
      setPipelineRuns(r);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".bento-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [loading]);

  const criticalPatients = patients.filter((p) => p.status === "critical");
  const activePatients = patients.filter((p) => p.status === "active");
  const totalPatients = patients.length;
  const runningPipelines = pipelineRuns.filter((r) => r.status === "running").length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;
  const recentAlerts = alerts.slice(0, 5);
  const recentRuns = pipelineRuns.slice(0, 5);

  const cardStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--bg-border)",
    padding: "1.25rem",
  };

  const labelStyle = {
    fontFamily: "var(--font-display)",
    fontSize: "0.5625rem",
    color: "var(--text-muted)",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    marginBottom: "0.375rem",
  };

  const valueStyle = {
    fontFamily: "var(--font-display)",
    fontSize: "2rem",
    color: "var(--text-primary)",
    lineHeight: 1,
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
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
          LOADING DASHBOARD...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            letterSpacing: "0.05em",
          }}
        >
          {user ? `Welcome, ${user.name}` : "Dashboard"}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            marginTop: "0.25rem",
          }}
        >
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Bento Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "1rem",
        }}
      >
        {/* Today's Summary — large card */}
        <div
          className="bento-card"
          style={{ ...cardStyle, gridRow: "1", gridColumn: "1" }}
        >
          <div style={labelStyle}>Today's Summary</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "1.25rem",
              marginTop: "0.75rem",
            }}
          >
            <div>
              <div style={labelStyle}>Total Patients</div>
              <div style={valueStyle}>{totalPatients}</div>
            </div>
            <div>
              <div style={labelStyle}>Critical</div>
              <div
                style={{ ...valueStyle, color: "var(--risk-critical)" }}
              >
                {criticalPatients.length}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Active Pipelines</div>
              <div
                style={{ ...valueStyle, color: "var(--accent-primary)" }}
              >
                {runningPipelines}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Unread Alerts</div>
              <div
                style={{
                  ...valueStyle,
                  color:
                    unreadAlerts > 0
                      ? "var(--risk-high)"
                      : "var(--text-primary)",
                }}
              >
                {unreadAlerts}
              </div>
            </div>
          </div>
        </div>

        {/* Active Variants placeholder */}
        <div className="bento-card" style={{ ...cardStyle }}>
          <div style={labelStyle}>Active Variants</div>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
                textAlign: "center",
              }}
            >
              No variant data yet.
              <br />
              Run a pipeline to see results.
            </p>
          </div>
        </div>

        {/* Resistance Alerts */}
        <div className="bento-card" style={{ ...cardStyle }}>
          <div style={labelStyle}>Resistance Alerts</div>
          <div style={{ marginTop: "0.75rem" }}>
            {recentAlerts.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-muted)",
                  fontSize: "0.8125rem",
                }}
              >
                No alerts.
              </p>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    marginBottom: "0.625rem",
                    paddingBottom: "0.625rem",
                    borderBottom: "1px solid var(--bg-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <RiskBadge
                      level={
                        alert.severity as
                          | "critical"
                          | "high"
                          | "moderate"
                          | "low"
                          | "safe"
                      }
                      size="sm"
                    />
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "var(--text-primary)",
                          lineHeight: 1.4,
                        }}
                      >
                        {alert.message}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.5625rem",
                          color: "var(--text-muted)",
                          marginTop: "0.25rem",
                        }}
                      >
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Patients */}
        <div
          className="bento-card"
          style={{ ...cardStyle, gridColumn: "1" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <div style={labelStyle}>Critical Patients</div>
            <Link
              href="/doctor/patients"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.5625rem",
                color: "var(--accent-primary)",
                textDecoration: "none",
                letterSpacing: "0.08em",
              }}
            >
              VIEW ALL →
            </Link>
          </div>
          {criticalPatients.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
              }}
            >
              No critical patients.
            </p>
          ) : (
            criticalPatients.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid var(--bg-border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {p.age}y • {p.gender} • {p.location}
                  </div>
                </div>
                <Link
                  href={`/doctor/patients/${p.id}`}
                  style={{
                    padding: "0.3125rem 0.75rem",
                    background: "transparent",
                    border: "1px solid var(--risk-critical)",
                    color: "var(--risk-critical)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.08em",
                    textDecoration: "none",
                  }}
                >
                  VIEW
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Pipeline Activity */}
        <div
          className="bento-card"
          style={{ ...cardStyle, gridColumn: "2 / 4" }}
        >
          <div style={labelStyle}>Recent Pipeline Activity</div>
          <div style={{ marginTop: "0.75rem" }}>
            {recentRuns.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2rem 0",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    textAlign: "center",
                  }}
                >
                  No pipeline runs yet.
                  <br />
                  <Link
                    href="/doctor/pipeline"
                    style={{
                      color: "var(--accent-primary)",
                      textDecoration: "none",
                    }}
                  >
                    Run your first analysis →
                  </Link>
                </p>
              </div>
            ) : (
              recentRuns.map((run) => (
                <div
                  key={run.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid var(--bg-border)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        run.status === "complete"
                          ? "var(--risk-safe)"
                          : run.status === "running"
                            ? "var(--accent-primary)"
                            : "var(--risk-critical)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {run.pathogen}
                    </span>
                    {run.variant && (
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "0.6875rem",
                          color: "var(--text-muted)",
                          marginLeft: "0.5rem",
                        }}
                      >
                        {run.variant}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.5625rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {run.status.toUpperCase()}
                  </div>
                  {run.createdAt && (
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "0.5625rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {formatRelativeTime(run.createdAt)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p
        style={{
          marginTop: "2rem",
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

"use client";

import { useEffect, useState } from "react";
import { getAlerts, markAlertRead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Alert } from "@/types";

export default function PatientAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) => prev.map((a) => a.id === alertId ? { ...a, read: true } : a));
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "1.75rem" }}>
        MY ALERTS
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", fontFamily: "var(--font-display)", color: "var(--accent-secondary)", fontSize: "0.875rem" }}>
          LOADING...
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ padding: "4rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-display)", color: "var(--text-muted)", fontSize: "0.875rem", letterSpacing: "0.08em" }}>
            NO ALERTS
          </p>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            You&apos;re all clear! No alerts at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: "1.25rem",
                background: alert.read ? "var(--bg-surface)" : "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderLeft: `4px solid ${
                  alert.severity === "critical" ? "var(--risk-critical)" :
                  alert.severity === "high" ? "var(--risk-high)" :
                  alert.severity === "moderate" ? "var(--risk-moderate)" :
                  "var(--risk-low)"
                }`,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                    <span style={{
                      fontFamily: "var(--font-display)", fontSize: "0.5625rem",
                      color: alert.severity === "critical" ? "var(--risk-critical)" : alert.severity === "high" ? "var(--risk-high)" : "var(--risk-moderate)",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}>
                      {alert.severity}
                    </span>
                    {!alert.read && (
                      <span style={{
                        padding: "1px 6px", background: "var(--accent-primary)", color: "#0a0b0d",
                        fontFamily: "var(--font-display)", fontSize: "0.5rem", letterSpacing: "0.08em",
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: alert.read ? "var(--text-secondary)" : "var(--text-primary)", lineHeight: 1.5 }}>
                    {alert.message}
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    {formatRelativeTime(alert.createdAt)}
                  </p>
                </div>
                {!alert.read && (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    style={{
                      padding: "0.375rem 0.75rem", background: "transparent",
                      border: "1px solid var(--bg-border)", color: "var(--text-muted)",
                      fontFamily: "var(--font-display)", fontSize: "0.5625rem",
                      letterSpacing: "0.08em", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    MARK READ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

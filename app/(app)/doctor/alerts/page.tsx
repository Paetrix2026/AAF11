"use client";

import { useEffect, useState } from "react";
import { getAlerts, markAlertRead } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatRelativeTime } from "@/lib/utils";
import type { Alert } from "@/types";

export default function AlertsPage() {
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
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch {
      // ignore
    }
  };

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
        ALERTS
      </h1>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            fontFamily: "var(--font-display)",
            color: "var(--accent-primary)",
            fontSize: "0.875rem",
          }}
        >
          LOADING...
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            padding: "4rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
            textAlign: "center",
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
            NO ALERTS
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: "1rem 1.25rem",
                background: alert.read ? "var(--bg-surface)" : "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                borderLeft: `3px solid ${
                  alert.read
                    ? "var(--bg-border)"
                    : `var(--risk-${alert.severity})`
                }`,
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
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
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: alert.read ? "var(--text-secondary)" : "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {alert.message}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "0.375rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.5625rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {alert.alertType.toUpperCase()} · {formatRelativeTime(alert.createdAt)}
                  </span>
                </div>
              </div>
              {!alert.read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(alert.id)}
                  style={{
                    padding: "0.25rem 0.625rem",
                    background: "transparent",
                    border: "1px solid var(--bg-border)",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.5rem",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  MARK READ
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

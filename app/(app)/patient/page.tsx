"use client";

import { useEffect, useState } from "react";
import { getAlerts } from "@/lib/api";
import { getUserFromCookie } from "@/lib/auth";
import { translateUrgency, formatRelativeTime } from "@/lib/utils";
import type { Alert, User } from "@/types";

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUserFromCookie();
    setUser(u);
    getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const recentAlerts = alerts.slice(0, 3);

  if (loading) {
    return (
      <div style={{ padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <div style={{ fontFamily: "var(--font-display)", color: "var(--accent-secondary)", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
          {user ? `Hello, ${user.name.split(" ")[0]}` : "My Dashboard"}
        </h1>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Your health status overview
        </p>
      </div>

      {/* Bento grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>

        {/* Active Variant in Region */}
        <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Active Variant In My Region
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80px" }}>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
              No active variant data for your region yet.
              <br />
              <span style={{ fontSize: "0.75rem" }}>Your doctor will update this when relevant.</span>
            </p>
          </div>
        </div>

        {/* Medication Status */}
        <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            My Medication Status
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80px" }}>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
              No medication data yet.
              <br />
              <span style={{ fontSize: "0.75rem" }}>Your doctor will add your medications.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Treatment Timeline — full width */}
      <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", marginBottom: "1rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Treatment Timeline
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
            No treatment history yet.
            <br />
            <span style={{ fontSize: "0.75rem" }}>Your treatment outcomes will appear here after your doctor runs an analysis.</span>
          </p>
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

        {/* Recent Alerts */}
        <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Recent Alerts
          </div>
          {recentAlerts.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No alerts. All clear! ✓
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {recentAlerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: "0.625rem 0.75rem",
                  background: "var(--bg-elevated)",
                  borderLeft: `3px solid ${
                    alert.severity === "critical" ? "var(--risk-critical)" :
                    alert.severity === "high" ? "var(--risk-high)" :
                    "var(--risk-moderate)"
                  }`,
                }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                    {alert.message}
                  </p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {formatRelativeTime(alert.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Next Steps
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {alerts.length === 0 ? (
              <div style={{
                padding: "0.75rem",
                background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderLeft: "3px solid var(--risk-safe)",
              }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--risk-safe)" }}>
                  ✓ No immediate action needed
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Continue your current medications as prescribed.
                </p>
              </div>
            ) : (
              alerts
                .filter((a) => !a.read)
                .slice(0, 3)
                .map((alert) => (
                  <div key={alert.id} style={{
                    padding: "0.75rem",
                    background: "var(--bg-elevated)",
                    borderLeft: "3px solid var(--risk-high)",
                  }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {translateUrgency(alert.alertType === "critical" ? "immediate" : "monitor")}
                    </p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

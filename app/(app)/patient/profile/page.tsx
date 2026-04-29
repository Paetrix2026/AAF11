"use client";

import { useEffect, useState } from "react";
import { getUserFromCookie } from "@/lib/auth";
import type { User } from "@/types";

export default function PatientProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "1.75rem" }}>
        MY PROFILE
      </h1>

      <div style={{ padding: "1.5rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", marginBottom: "1rem" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Account Information
        </div>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              { label: "Full Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Account Type", value: "Patient" },
              { label: "Telegram Alerts", value: user.telegramHandle ? `@${user.telegramHandle}` : "Not connected" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--bg-border)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.6875rem", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                  {label}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Not logged in
          </p>
        )}
      </div>

      <div style={{ padding: "1rem", background: "rgba(0,229,195,0.05)", border: "1px solid rgba(0,229,195,0.15)" }}>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          To update your information or medication details, please contact your healthcare provider directly.
          Changes to your medical record must be made by your assigned doctor.
        </p>
      </div>
    </div>
  );
}

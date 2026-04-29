"use client";

import { getUserFromCookie } from "@/lib/auth";

export default function SettingsPage() {
  const user = getUserFromCookie();

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.25rem",
          color: "var(--text-primary)",
          letterSpacing: "0.05em",
          marginBottom: "1.75rem",
        }}
      >
        SETTINGS
      </h1>
      <div
        style={{
          padding: "1.5rem",
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
          Account
        </div>
        {user ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
              { label: "Role", value: user.role.toUpperCase() },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.625rem 0",
                  borderBottom: "1px solid var(--bg-border)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            Not logged in
          </p>
        )}
      </div>
    </div>
  );
}

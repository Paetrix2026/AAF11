"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Pill, Bell, User } from "lucide-react";
import { getUserFromCookie, clearAuthCookie } from "@/lib/auth";
import { connectTelegram } from "@/lib/api";
import type { User as UserType } from "@/types";

const NAV_ITEMS = [
  { icon: Home, label: "My Dashboard", href: "/patient" },
  { icon: Pill, label: "My Medications", href: "/patient/medications" },
  { icon: Bell, label: "My Alerts", href: "/patient/alerts" },
  { icon: User, label: "My Profile", href: "/patient/profile" },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [telegramHandle, setTelegramHandle] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  const handleConnect = async () => {
    if (!telegramHandle.trim()) return;
    setConnecting(true);
    try {
      await connectTelegram(telegramHandle.trim());
      alert("Telegram connected successfully!");
    } catch {
      alert("Failed to connect Telegram. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, bottom: 0, width: "240px",
      background: "var(--bg-surface)", borderRight: "1px solid var(--bg-border)",
      display: "flex", flexDirection: "column", zIndex: 100,
    }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--bg-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M8 4C8 4 12 8 16 16C20 24 24 28 24 28" stroke="#00e5c3" strokeWidth="2" strokeLinecap="round"/>
            <path d="M24 4C24 4 20 8 16 16C12 24 8 28 8 28" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem", color: "var(--accent-primary)", letterSpacing: "0.08em" }}>HEALYNX</span>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Patient Portal</div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(0,180,216,0.15)", border: "1px solid var(--accent-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--accent-secondary)",
            }}>
              {getInitials(user.name)}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500 }}>{user.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.75rem" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.5rem 0.625rem", textDecoration: "none",
                color: isActive ? "var(--accent-secondary)" : "var(--text-secondary)",
                background: isActive ? "rgba(0,180,216,0.06)" : "transparent",
                borderLeft: isActive ? "2px solid var(--accent-secondary)" : "2px solid transparent",
                fontFamily: "var(--font-body)", fontSize: "0.875rem",
                marginBottom: "2px", transition: "all 0.15s",
              }}
            >
              <Icon size={15} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Telegram section */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--bg-border)" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          {user?.telegramHandle ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--risk-safe)" }}>
              <span>🟢</span> Alerts Connected
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="@telegram_handle"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                style={{
                  width: "100%", padding: "0.375rem 0.5rem",
                  background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
                  color: "var(--text-primary)", fontFamily: "var(--font-body)",
                  fontSize: "0.75rem", outline: "none", marginBottom: "0.375rem",
                }}
              />
              <button
                onClick={handleConnect}
                disabled={connecting}
                style={{
                  width: "100%", padding: "0.375rem", background: "transparent",
                  border: "1px solid var(--accent-secondary)", color: "var(--accent-secondary)",
                  fontFamily: "var(--font-display)", fontSize: "0.625rem",
                  letterSpacing: "0.08em", cursor: "pointer",
                }}
              >
                {connecting ? "CONNECTING..." : "CONNECT TELEGRAM"}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "0.375rem 0.5rem", background: "transparent",
            border: "none", color: "var(--text-muted)", fontFamily: "var(--font-body)",
            fontSize: "0.8125rem", cursor: "pointer", textAlign: "left",
          }}
        >
          ⎋ Log Out
        </button>
      </div>
    </div>
  );
}

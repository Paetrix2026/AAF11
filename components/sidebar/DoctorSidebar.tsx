"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import { LayoutDashboard, FlaskConical, AlertTriangle, Settings, Dna } from "lucide-react";
import { getPatients } from "@/lib/api";
import { getUserFromCookie, clearAuthCookie } from "@/lib/auth";
import type { Patient, User } from "@/types";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
  { icon: Dna, label: "Run Pipeline", href: "/doctor/pipeline" },
  { icon: AlertTriangle, label: "Alerts", href: "/doctor/alerts" },
  { icon: Settings, label: "Settings", href: "/doctor/settings" },
];

const STATUS_ORDER = ["critical", "active", "stable"] as const;

export function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    setUser(getUserFromCookie());
    getPatients()
      .then((data) => setPatients(data))
      .catch(() => setPatients([]));
  }, []);

  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(sidebarRef.current, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
    }
  }, []);

  useEffect(() => {
    if (patients.length > 0) {
      gsap.fromTo(".patient-item", { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 });
    }
  }, [patients]);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = STATUS_ORDER.reduce<Record<string, Patient[]>>((acc, status) => {
    acc[status] = filtered.filter((p) => p.status === status);
    return acc;
  }, { critical: [], active: [], stable: [] });

  const statusConfig = {
    critical: { label: "🔴 Critical", color: "var(--risk-critical)" },
    active: { label: "🟡 Active", color: "var(--risk-moderate)" },
    stable: { label: "✓ Stable", color: "var(--risk-safe)" },
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  return (
    <div
      ref={sidebarRef}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "260px",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--bg-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--bg-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M8 4C8 4 12 8 16 16C20 24 24 28 24 28" stroke="#00e5c3" strokeWidth="2" strokeLinecap="round"/>
            <path d="M24 4C24 4 20 8 16 16C12 24 8 28 8 28" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="10" x2="22" y2="10" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
            <line x1="8.5" y1="16" x2="23.5" y2="16" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
            <line x1="10" y1="22" x2="22" y2="22" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
          </svg>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", color: "var(--accent-primary)", letterSpacing: "0.1em" }}>HEALYNX</span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--text-muted)", marginLeft: "auto" }}>MD CONSOLE</span>
        </div>

        {/* Doctor info */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "rgba(0,229,195,0.15)", border: "1px solid var(--accent-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "0.625rem", color: "var(--accent-primary)",
            }}>
              {getInitials(user.name)}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>MD | VERIFIED PRACTITIONER</div>
            </div>
          </div>
        )}

        {/* New Analysis button */}
        <Link
          href="/doctor/pipeline"
          style={{
            display: "block", marginTop: "0.875rem",
            padding: "0.625rem 0.75rem", background: "var(--accent-primary)",
            color: "#0a0b0d", fontFamily: "var(--font-display)", fontSize: "0.75rem",
            fontWeight: "700", letterSpacing: "0.08em", textAlign: "center",
            textDecoration: "none", boxShadow: "0 0 20px var(--accent-glow)",
          }}
        >
          + NEW ANALYSIS
        </Link>
      </div>

      {/* Patient list */}
      <div style={{ flex: 1, padding: "0.75rem 0.75rem 0", overflow: "hidden" }}>
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "0.5rem 0.625rem",
            background: "var(--bg-elevated)", border: "1px solid var(--bg-border)",
            color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "0.8125rem",
            outline: "none", marginBottom: "0.75rem",
          }}
        />

        {patients.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "0.8125rem", textAlign: "center", padding: "1rem 0" }}>
            No patients found
          </p>
        )}

        {STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          const config = statusConfig[status];
          return (
            <div key={status} style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.375rem", padding: "0 0.25rem" }}>
                {config.label}
              </div>
              {group.map((patient) => {
                const isActive = pathname === `/doctor/patients/${patient.id}`;
                return (
                  <Link
                    key={patient.id}
                    href={`/doctor/patients/${patient.id}`}
                    className="patient-item"
                    style={{
                      display: "block", padding: "0.5rem 0.625rem",
                      borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                      background: isActive ? "rgba(0,229,195,0.06)" : "transparent",
                      textDecoration: "none", marginBottom: "1px",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: isActive ? "var(--accent-primary)" : "var(--text-primary)", fontWeight: isActive ? 500 : 400 }}>
                        {patient.name}
                      </span>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: config.color, flexShrink: 0 }} />
                    </div>
                    {patient.medications[0] && (
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                        {patient.medications[0].name} {patient.medications[0].dose}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--bg-border)" }}>
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
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                background: isActive ? "rgba(0,229,195,0.06)" : "transparent",
                fontFamily: "var(--font-body)", fontSize: "0.875rem",
                borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                marginBottom: "2px", transition: "all 0.15s",
              }}
            >
              <Icon size={15} />
              {item.label}
              {item.label === "Alerts" && alertCount > 0 && (
                <span style={{
                  marginLeft: "auto", padding: "1px 6px",
                  background: "var(--risk-critical)", color: "#fff",
                  fontFamily: "var(--font-display)", fontSize: "0.5625rem",
                  borderRadius: "2px",
                }}>
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.5rem 0.625rem", background: "transparent", border: "none",
            color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "0.875rem",
            cursor: "pointer", marginTop: "0.5rem", textAlign: "left",
          }}
        >
          ⎋ Log Out
        </button>
      </div>
    </div>
  );
}

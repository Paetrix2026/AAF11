"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { login } from "@/lib/api";
import { setAuthCookie, setUserCookie } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; opacity: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 195, ${p.opacity})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 229, 195, ${0.05 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Card entrance animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, role);
      setAuthCookie(result.token);
      setUserCookie(result.user);
      router.push(result.user.role === "doctor" ? "/doctor" : "/patient");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Particle background */}
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />

      {/* Login card */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          padding: "2rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--bg-border)",
          boxShadow: "0 0 40px rgba(0,229,195,0.08)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            {/* DNA Helix SVG */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 4C8 4 12 8 16 16C20 24 24 28 24 28" stroke="#00e5c3" strokeWidth="2" strokeLinecap="round"/>
              <path d="M24 4C24 4 20 8 16 16C12 24 8 28 8 28" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="10" x2="22" y2="10" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
              <line x1="8.5" y1="16" x2="23.5" y2="16" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
              <line x1="10" y1="22" x2="22" y2="22" stroke="#00e5c3" strokeWidth="1.5" strokeOpacity="0.6"/>
            </svg>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "0.05em" }}>
              HEALYNX
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "0.875rem", fontStyle: "italic" }}>
            Clinical Intelligence for Pandemic Response
          </p>
        </div>

        {/* Role selector */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {(["doctor", "patient"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                padding: "0.75rem",
                border: role === r ? "1px solid var(--accent-primary)" : "1px solid var(--bg-border)",
                background: role === r ? "rgba(0,229,195,0.08)" : "transparent",
                color: role === r ? "var(--accent-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-display)",
                fontSize: "0.75rem",
                cursor: "pointer",
                letterSpacing: "0.1em",
                transition: "all 0.2s",
                textTransform: "uppercase",
              }}
            >
              {r === "doctor" ? "🩺 Doctor" : "🏥 Patient"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@hospital.org"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "0.625rem", color: "var(--text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "var(--bg-elevated)",
                border: "1px solid var(--bg-border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "var(--risk-critical)", fontFamily: "var(--font-body)", fontSize: "0.875rem", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.875rem",
              background: loading ? "rgba(0,229,195,0.3)" : "var(--accent-primary)",
              color: "#0a0b0d",
              fontFamily: "var(--font-display)",
              fontSize: "0.875rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 20px var(--accent-glow)",
              transition: "all 0.2s",
              textTransform: "uppercase",
            }}
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}

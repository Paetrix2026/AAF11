"use client";

export default function MedicationsPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "900px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: "1.75rem" }}>
        MY MEDICATIONS
      </h1>

      <div style={{ padding: "4rem 2rem", background: "var(--bg-surface)", border: "1px solid var(--bg-border)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--text-muted)", marginBottom: "1rem" }}>💊</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", color: "var(--text-muted)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          NO MEDICATIONS ON RECORD
        </p>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Your doctor will add your medications after your first consultation.
          <br />
          Medication effectiveness data will appear here once analysis is run.
        </p>
      </div>

      <p style={{ marginTop: "2rem", fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
        Healynx assists clinical decision-making and does not replace professional medical judgment.
      </p>
    </div>
  );
}

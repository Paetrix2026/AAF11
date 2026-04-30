import type {
  Alert,
  Outcome,
  Patient,
  PatientInput,
  PipelineInput,
  PipelineResult,
  PipelineRun,
  User,
} from "@/types";

const BASE_URL = ""; // Using Next.js rewrites to proxy to 127.0.0.1:8000

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getCookie("token");
  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log(`[API Call] Fetching: ${fullUrl}`);
  const response = await fetch(fullUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.data as T;
}

export const login = (email: string, password: string, role: string) =>
  apiCall<{ token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });

export const getMe = () => apiCall<User>("/api/auth/me");

export const logout = () =>
  apiCall<void>("/api/auth/logout", { method: "POST" });

export const runPipeline = (payload: PipelineInput) =>
  apiCall<{ runId: string }>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const streamPipeline = (
  runId: string,
  onStep: (data: string) => void,
) => {
  const es = new EventSource(`${BASE_URL}/api/stream/${runId}`);

  // Generic message listener (for "done" status)
  es.onmessage = (e) => onStep(e.data);

  // Named update listener (for "agent" status)
  es.addEventListener("update", (e) => {
    onStep(e.data);
  });

  return es;
};

export const getPipelineResult = (runId: string) =>
  apiCall<PipelineRun>(`/api/result/${runId}`);

export const submitOutcome = (runId: string, outcome: string, notes: string) =>
  apiCall<Outcome>("/api/outcome", {
    method: "POST",
    body: JSON.stringify({ runId, outcome, notes }),
  });

export const getPatients = () => apiCall<Patient[]>("/api/patients");

export const getPatient = (id: string) =>
  apiCall<Patient>(`/api/patients/${id}`);

export const createPatient = (data: PatientInput) =>
  apiCall<Patient>("/api/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePatient = (id: string, data: Partial<PatientInput>) =>
  apiCall<Patient>(`/api/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const getAlerts = () => apiCall<Alert[]>("/api/alerts");

export const getPatientAlerts = (patientId: string) =>
  apiCall<Alert[]>(`/api/alerts/patient/${patientId}`);

export const markAlertRead = (alertId: string) =>
  apiCall<Alert>(`/api/alerts/mark-read/${alertId}`, { method: "POST" });

export const connectTelegram = (handle: string) =>
  apiCall<void>("/api/telegram/connect", {
    method: "POST",
    body: JSON.stringify({ handle }),
  });

export const getPipelineRuns = (patientId?: string) =>
  apiCall<PipelineRun[]>(
    patientId ? `/api/runs?patient_id=${patientId}` : "/api/runs",
  );
export const getScreeningCompounds = () =>
  apiCall<any[]>("/api/screening-compounds");

export const downloadReport = async (runId: string): Promise<void> => {
  // Fetch the JSON report from the backend
  const token = getCookie("token");
  const response = await fetch(`/api/export?run_id=${runId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);
  const report = await response.json();

  // Dynamically import jsPDF and autoTable
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const col = "#10b981"; // emerald
  const dark = "#0f172a"; // slate-900
  const mid = "#475569"; // slate-600
  const light = "#f8fafc"; // slate-50

  // ── Header banner ───────────────────────────────────────────────
  doc.setFillColor(col);
  doc.rect(0, 0, W, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor("#ffffff");
  doc.text("HEALYNX", margin, 13);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Clinical Intelligence Report", margin + 32, 13);
  doc.text(`Run ID: ${runId.slice(0, 8).toUpperCase()}`, W - margin, 13, {
    align: "right",
  });

  let y = 32;

  // ── Helper: section heading ──────────────────────────────────────
  const sectionTitle = (title: string) => {
    if (y > pageH - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor("#f1f5f9");
    doc.rect(margin, y - 5, W - margin * 2, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(col);
    doc.text(title.toUpperCase(), margin + 3, y + 1);
    y += 10;
    doc.setTextColor(dark);
  };

  const labelValue = (label: string, value: string, x = margin, indent = 0) => {
    if (y > pageH - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(mid);
    doc.text(label + ":", x + indent, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark);
    const val = String(value ?? "—");
    const lines = doc.splitTextToSize(val, W - margin - x - indent - 40);
    doc.text(lines, x + indent + 28, y);
    y += Math.max(5, lines.length * 4.5);
  };

  // ── 1. Clinical Summary ──────────────────────────────────────────
  sectionTitle("Clinical Summary");
  labelValue(
    "Primary Drug",
    report.primaryDrug || report.report?.primaryDrug || "N/A",
  );
  labelValue(
    "Confidence",
    `${report.primaryConfidence ?? report.report?.primaryConfidence ?? "—"}%`,
  );
  labelValue("Risk Level", report.riskLevel || report.report?.riskLevel || "—");
  labelValue("Urgency", report.urgency || report.report?.urgency || "—");
  labelValue(
    "Alternative Drug",
    report.alternativeDrug || report.report?.alternativeDrug || "None",
  );
  labelValue(
    "Resistance Risk",
    report.primaryResistanceRisk || report.report?.primaryResistanceRisk || "—",
  );
  y += 3;

  // Doctor summary block
  const doctorSummary =
    report.doctorSummary || report.report?.doctorSummary || "";
  if (doctorSummary) {
    if (y > pageH - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    doc.setTextColor(mid);
    doc.text("Doctor Summary:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(dark);
    const lines = doc.splitTextToSize(doctorSummary, W - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }

  // ── 2. Simulation Results ────────────────────────────────────────
  const simResults =
    report.simulationResults || report.report?.simulationResults || [];
  if (simResults.length > 0) {
    sectionTitle("Clinical Simulation");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [
        [
          "Drug",
          "Binding (kcal/mol)",
          "Resistance",
          "Decision Score",
          "Outcome",
          "Duration",
        ],
      ],
      body: simResults.map((r: any) => [
        r.name ?? "—",
        r.binding != null ? r.binding.toFixed(1) : "—",
        r.resistance != null ? `${(r.resistance * 100).toFixed(0)}%` : "—",
        r.decision_score != null ? r.decision_score.toFixed(3) : "—",
        r.predicted_outcome ?? "—",
        r.time_to_failure ?? "—",
      ]),
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [16, 185, 129],
        fontSize: 7,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5, overflow: "linebreak" },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 3. ADMET Properties ──────────────────────────────────────────
  const admet = report.admetScores || report.report?.admetScores || {};
  const admetKeys = [
    "absorption",
    "distribution",
    "metabolism",
    "excretion",
    "toxicity",
  ];
  const admetRows = admetKeys
    .filter((k) => admet[k] != null)
    .map((k) => [
      k.charAt(0).toUpperCase() + k.slice(1),
      `${(admet[k] * 100).toFixed(0)}%`,
    ]);
  if (admetRows.length > 0) {
    sectionTitle("ADMET Properties");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Property", "Score"]],
      body: admetRows,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [16, 185, 129],
        fontSize: 7,
      },
      bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5 },
      tableWidth: 80,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── 4. Mutations Detected ────────────────────────────────────────
  const mutations = report.mutations || report.report?.mutations || [];
  if (mutations.length > 0) {
    sectionTitle("Mutations Detected");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(dark);
    const mutStr = mutations.join("  •  ");
    const lines = doc.splitTextToSize(mutStr, W - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  }

  // ── 5. Patient Summary ───────────────────────────────────────────
  const patientSummary =
    report.patientSummary || report.report?.patientSummary || "";
  const actionRequired =
    report.actionRequired || report.report?.actionRequired || "";
  if (patientSummary || actionRequired) {
    sectionTitle("Patient Information");
    if (patientSummary) labelValue("Patient Summary", patientSummary);
    if (actionRequired) labelValue("Action Required", actionRequired);
    y += 3;
  }

  // ── Footer on every page ─────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor("#f1f5f9");
    doc.rect(0, pageH - 10, W, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(mid);
    doc.text(
      `Healynx Clinical AI  •  Generated ${new Date().toLocaleDateString()}  •  Confidential`,
      margin,
      pageH - 4,
    );
    doc.text(`Page ${p} of ${totalPages}`, W - margin, pageH - 4, {
      align: "right",
    });
  }

  doc.save(`healynx-report-${runId.slice(0, 8)}.pdf`);
};

export const searchPathogens = (query: string) =>
  apiCall<any[]>(`/api/search?q=${query}`);

export const searchLocal = (query: string) =>
  apiCall<any[]>(`/api/search/local?q=${query}`);

export const searchOnline = (query: string) =>
  apiCall<any[]>(`/api/search/online?q=${query}`);

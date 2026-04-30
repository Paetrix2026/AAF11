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
  const token = getCookie("token");
  const response = await fetch(`/api/export?run_id=${runId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `healynx-report-${runId}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const searchPathogens = (query: string) =>
  apiCall<any[]>(`/api/search?q=${query}`);

export const searchLocal = (query: string) =>
  apiCall<any[]>(`/api/search/local?q=${query}`);

export const searchOnline = (query: string) =>
  apiCall<any[]>(`/api/search/online?q=${query}`);

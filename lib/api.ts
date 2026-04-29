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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getCookie("token");
  const response = await fetch(`${BASE_URL}${endpoint}`, {
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

export const streamPipeline = (runId: string, onStep: (step: string) => void) => {
  const es = new EventSource(`${BASE_URL}/api/stream/${runId}`);
  es.onmessage = (e) => onStep(e.data);
  return es;
};

export const getPipelineResult = (runId: string) =>
  apiCall<PipelineRun>(`/api/pipeline/result/${runId}`);

export const submitOutcome = (runId: string, outcome: string, notes: string) =>
  apiCall<Outcome>("/api/outcome", {
    method: "POST",
    body: JSON.stringify({ runId, outcome, notes }),
  });

export const getPatients = () => apiCall<Patient[]>("/api/patients");

export const getPatient = (id: string) => apiCall<Patient>(`/api/patients/${id}`);

export const createPatient = (data: PatientInput) =>
  apiCall<Patient>("/api/patients", { method: "POST", body: JSON.stringify(data) });

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
    patientId ? `/api/pipeline/runs?patient_id=${patientId}` : "/api/pipeline/runs"
  );
export const getScreeningCompounds = () =>
  apiCall<any[]>("/api/screening-compounds");

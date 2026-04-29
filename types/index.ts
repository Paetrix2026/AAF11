export type UserRole = "doctor" | "patient";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  telegramHandle?: string;
  alertOptIn?: boolean;
  createdAt?: string;
}

export interface Medication {
  name: string;
  dose: string;
  since: string;
}

export interface Patient {
  id: string;
  userId?: string;
  doctorId: string;
  name: string;
  age?: number;
  gender?: string;
  location?: string;
  conditions: string[];
  medications: Medication[];
  status: "critical" | "active" | "stable";
  createdAt?: string;
}

export type PatientInput = Omit<Patient, "id" | "createdAt">;

export interface PipelineRun {
  id: string;
  patientId: string;
  doctorId: string;
  pathogen: string;
  variant?: string;
  status: "running" | "complete" | "failed";
  result?: PipelineResult;
  createdAt?: string;
}

export interface PipelineResult {
  primaryDrug: string;
  primaryConfidence: number;
  primaryResistanceRisk: "low" | "moderate" | "high";
  alternativeDrug: string;
  alternativeConfidence: number;
  urgency: "immediate" | "24_hours" | "48_hours" | "monitor";
  riskLevel: "critical" | "high" | "moderate" | "low";
  doctorSummary: string;
  patientSummary: string;
  actionRequired: string;
  smiles?: string;
  pdbData?: string;
  resistanceScores?: Record<string, number>;
  similarCases?: SimilarCase[];
  admetScores?: AdmetScores;
}

export interface SimilarCase {
  caseId: string;
  drug: string;
  outcome: string;
  date: string;
}

export interface AdmetScores {
  absorption: number;
  distribution: number;
  metabolism: number;
  excretion: number;
  toxicity: number;
  mw?: number;
  tpsa?: number;
  logP?: number;
}

export interface PipelineInput {
  patientId: string;
  pathogen: string;
  variant?: string;
  symptoms?: string[];
  overrideMutations?: string[];
}

export interface Alert {
  id: string;
  targetId: string;
  targetType: "patient" | "doctor";
  alertType: string;
  message: string;
  severity: "critical" | "high" | "moderate" | "low";
  read: boolean;
  createdAt: string;
}

export interface Outcome {
  id: string;
  runId: string;
  patientId: string;
  recommendedDrug?: string;
  outcome?: "effective" | "partial" | "failed" | "pending";
  outcomeScore?: number;
  notes?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface AgentStep {
  agentName: string;
  status: "pending" | "running" | "complete" | "failed";
  message: string;
  timestamp?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

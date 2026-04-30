"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  getPatient,
  getPipelineRuns,
  getPatientAlerts,
  downloadReport,
} from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";
import { formatDate } from "@/lib/utils";
import type { Patient, PipelineRun, Alert } from "@/types";
import {
  ArrowLeft,
  Activity,
  MapPin,
  Pill,
  Stethoscope,
  BrainCircuit,
  History,
  Bell,
  BellOff,
  MessageCircle,
} from "lucide-react";
import { FamilyAssistant } from "@/components/shared/FamilyAssistant";

const cardStyle =
  "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden";
const labelStyle =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-amber-50 text-amber-600 border border-amber-100",
    complete: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    failed: "bg-red-50 text-red-600 border border-red-100",
  };
  const cls =
    map[status] ?? "bg-slate-50 text-slate-500 border border-slate-100";
  return (
    <span
      className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${cls}`}
    >
      {status}
    </span>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPatient(id),
      getPipelineRuns(id).catch(() => [] as PipelineRun[]),
      getPatientAlerts(id).catch(() => [] as Alert[]),
    ])
      .then(([p, r, a]) => {
        setPatient(p);
        setRuns(r.slice(0, 5));
        setAlerts(a);
      })
      .catch(() => setError("Patient not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Loading patient dossier...
          </p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6 lg:p-10">
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-8 text-center">
          <p className="text-red-500 font-bold text-sm uppercase tracking-widest">
            {error || "Patient not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <Link
            href="/doctor/patients"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Patients
          </Link>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical Dossier</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {patient.name}
          </h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            ID: {patient.id}
          </p>
        </div>
        <div className="mt-2">
          <RiskBadge
            level={
              patient.status === "critical"
                ? "critical"
                : patient.status === "active"
                  ? "moderate"
                  : "safe"
            }
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Demographics */}
          <div className={`${cardStyle} p-8`}>
            <div className="mb-6">
              <p className={labelStyle}>Demographics</p>
              <h3 className="text-xl font-black text-slate-900">
                Patient Profile
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Age",
                  value: patient.age ? `${patient.age} yrs` : "—",
                },
                { label: "Gender", value: patient.gender ?? "—" },
                {
                  label: "Location",
                  value: patient.location ?? "—",
                  icon: MapPin,
                  full: true,
                },
                {
                  label: "Patient Since",
                  value: patient.createdAt
                    ? formatDate(patient.createdAt)
                    : "—",
                  full: true,
                },
              ].map(({ label, value, full }) => (
                <div
                  key={label}
                  className={`p-4 bg-slate-50/50 rounded-2xl border border-slate-100 ${full ? "col-span-2" : ""}`}
                >
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comorbidities */}
          <div className={`${cardStyle} p-8`}>
            <div className="mb-6">
              <p className={labelStyle}>Comorbidities</p>
              <h3 className="text-xl font-black text-slate-900">Conditions</h3>
            </div>
            {!(patient.conditions && patient.conditions.length > 0) ? (
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-4">
                None recorded
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {patient.conditions.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medications */}
          <div className={`${cardStyle} p-8`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Pill className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className={labelStyle}>Prescriptions</p>
                <h3 className="text-xl font-black text-slate-900">
                  Medications
                </h3>
              </div>
            </div>
            {!(patient.medications && patient.medications.length > 0) ? (
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest py-4">
                None prescribed
              </p>
            ) : (
              <div className="space-y-3">
                {patient.medications.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-black text-slate-900">
                        {med.name}
                      </p>
                      <span className="text-[10px] font-bold text-slate-500">
                        {med.dose}
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Since {med.since}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — Pipeline Runner */}
        <div className="lg:col-span-2">
          <div className={`${cardStyle} h-full`}>
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className={labelStyle}>Diagnostic Engine</p>
                <h3 className="text-xl font-black text-slate-900">
                  AI Analysis Pipeline
                </h3>
              </div>
            </div>
            <div className="p-8">
              <PipelineRunner patientId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* Prior Pipeline Runs */}
      <div className={cardStyle}>
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <p className={labelStyle}>Audit Trail</p>
            <h3 className="text-xl font-black text-slate-900">
              Prior Pipeline Runs
            </h3>
          </div>
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Last {runs.length} runs
          </span>
        </div>

        {runs.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              No pipeline runs recorded for this patient
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Run ID
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Pathogen
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Export
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-50/30 transition-all"
                  >
                    <td className="p-6">
                      <p className="text-[10px] font-black text-slate-500 font-mono">
                        {run.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-slate-900">
                        {(run as unknown as { pathogen?: string }).pathogen ??
                          "—"}
                      </p>
                    </td>
                    <td className="p-6">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="p-6">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {run.createdAt ? formatDate(run.createdAt) : "—"}
                      </p>
                    </td>
                    <td className="p-6 text-right">
                      {(run.status === "complete" ||
                        (run.status as string) === "completed") && (
                        <button
                          onClick={() => downloadReport(run.id)}
                          className="px-3 py-1.5 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"
                        >
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Alerts */}
      <div className={cardStyle}>
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className={labelStyle}>Monitoring</p>
            <h3 className="text-xl font-black text-slate-900">
              Patient Alerts
            </h3>
          </div>
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <BellOff className="w-8 h-8 text-slate-200" />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              No alerts for this patient
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                  alert.read
                    ? "bg-slate-50/50 border-slate-100"
                    : "bg-amber-50/60 border-amber-100"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    alert.read ? "bg-slate-300" : "bg-amber-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {alert.message}
                  </p>
                  {alert.createdAt && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {formatDate(alert.createdAt)}
                    </p>
                  )}
                </div>
                {!alert.read && (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0">
                    New
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Family Communication Layer */}
      <div className={cardStyle}>
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className={labelStyle}>Clinical Communication Layer</p>
            <h3 className="text-xl font-black text-slate-900">
              Family AI Assistant
            </h3>
          </div>
          <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            @discovery67bot
          </span>
        </div>
        <div className="p-8">
          <FamilyAssistant
            patientName={patient.name}
            primaryDrug={patient.medications?.[0]?.name}
            riskLevel={patient.status}
            predictedOutcome={
              patient.status === "critical" ? "decline" : "stable"
            }
            patientSummary={`${patient.name} has ${
              patient.conditions?.join(", ") || "no known conditions"
            }.`}
          />
        </div>
      </div>
    </div>
  );
}

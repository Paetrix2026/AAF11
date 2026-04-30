"use client";

import { useEffect, useState } from "react";
import { getAlerts, getMe, getPatient, getPipelineRuns } from "@/lib/api";
import { getUserFromCookie } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Shield,
  MapPin,
  Pill,
  History,
  Bell,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  Microscope,
  Thermometer,
  Heart,
  Droplet,
  ArrowUpRight,
} from "lucide-react";
import type { Alert, Patient, PipelineRun, User } from "@/types";
import { FamilyAssistant } from "@/components/shared/FamilyAssistant";

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieUser = getUserFromCookie();
    setUser(cookieUser);
    const fetchData = async () => {
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        const [patientData, alertsData, runsData] = await Promise.allSettled([
          getPatient(freshUser.id),
          getAlerts(),
          getPipelineRuns(), // backend auto-resolves patient_id for patient role
        ]);
        if (patientData.status === "fulfilled") setPatient(patientData.value);
        if (alertsData.status === "fulfilled") setAlerts(alertsData.value);
        if (runsData.status === "fulfilled") setRuns(runsData.value ?? []);
      } catch {
        // getMe failed — still try alerts with cookie user if available
        try {
          const alertsData = await getAlerts();
          setAlerts(alertsData);
        } catch {
          setAlerts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cardStyle =
    "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50 shadow-sm";
  const headerLabelStyle =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-transparent">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Initialising Patient Node...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Bio-Stream Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Hello, {user?.name.split(" ")[0] || "Patient"}
          </h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest flex items-center gap-2">
            Bio-ID: {user?.id.slice(0, 8).toUpperCase()} • Last Sync:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Calendar className="w-4 h-4" /> Schedule Session
          </button>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10">
            <Shield className="w-4 h-4" /> Security Audit
          </button>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[160px]">
        {/* Quick Stat: Risk Level */}
        {(() => {
          const status = patient?.status ?? "unknown";
          const isCritical = status === "critical";
          const isStable = status === "stable" || status === "active";
          const colorClass = isCritical
            ? "text-red-600"
            : isStable
              ? "text-emerald-600"
              : "text-slate-600";
          const bgClass = isCritical
            ? "bg-red-50/30 border-red-100"
            : "bg-emerald-50/30 border-emerald-100";
          const iconClass = isCritical ? "text-red-500" : "text-emerald-500";
          return (
            <div
              className={`${cardStyle} p-8 flex flex-col justify-between ${bgClass}`}
            >
              <div className="flex justify-between items-start">
                <h4 className={headerLabelStyle}>Risk Profile</h4>
                <ShieldCheck className={`w-4 h-4 ${iconClass}`} />
              </div>
              <div className="space-y-1">
                <span className={`text-3xl font-black uppercase ${colorClass}`}>
                  {patient
                    ? status.charAt(0).toUpperCase() + status.slice(1)
                    : "—"}
                </span>
                <p
                  className={`text-[9px] font-bold uppercase tracking-widest ${colorClass}/60`}
                >
                  {patient ? "Status Confirmed" : "No Record"}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Quick Stat: Heart Rate */}
        <div className={`${cardStyle} p-8 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Bio-Pulse</h4>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">72</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              BPM
            </span>
          </div>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
            Reference
          </p>
        </div>

        {/* Quick Stat: Temperature */}
        <div className={`${cardStyle} p-8 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Core Temp</h4>
            <Thermometer className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">36.6</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              °C
            </span>
          </div>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
            Reference
          </p>
        </div>

        {/* Quick Stat: Hydration */}
        <div className={`${cardStyle} p-8 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Cellular Hydration</h4>
            <Droplet className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">88</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              %
            </span>
          </div>
          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">
            Reference
          </p>
        </div>

        {/* Diagnostic Timeline - BIG BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-3 lg:row-span-3 flex flex-col`}
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className={headerLabelStyle}>Archive</h4>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Clinical Timeline
              </h3>
            </div>
            <div className="px-4 py-2 bg-slate-100 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {runs.length} Analysis{runs.length !== 1 ? "es" : ""}
            </div>
          </div>

          {runs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
                <Microscope className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em] mb-2">
                No analyses yet
              </h4>
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold max-w-xs leading-relaxed">
                Your doctor hasn&apos;t run a diagnostic pipeline for you yet.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {runs.map((run) => {
                const r = run as PipelineRun & {
                  result?: Record<string, unknown>;
                };
                const res = r.result as Record<string, unknown> | undefined;
                const drug = (res?.primaryDrug ?? "—") as string;
                const confidence = res?.primaryConfidence as number | undefined;
                const outcome = res?.predictedOutcome as string | undefined;
                const urgency = (res?.urgency ?? "monitor") as string;
                const riskLevel = (res?.riskLevel ?? "—") as string;
                const patientSummary = res?.patientSummary as
                  | string
                  | undefined;

                const urgencyColor =
                  urgency === "immediate"
                    ? "text-red-600 bg-red-50 border-red-100"
                    : urgency === "switch"
                      ? "text-amber-600 bg-amber-50 border-amber-100"
                      : urgency === "monitor"
                        ? "text-blue-600 bg-blue-50 border-blue-100"
                        : "text-emerald-600 bg-emerald-50 border-emerald-100";

                const statusColor =
                  run.status === "complete" ||
                  (run.status as string) === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : run.status === "running"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700";

                return (
                  <div
                    key={run.id}
                    className="p-6 hover:bg-slate-50/50 transition-all group"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-black text-slate-900 text-sm">
                          {((run as Record<string, unknown>)
                            .pathogen as string) ?? "—"}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {run.createdAt
                            ? new Date(run.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColor}`}
                      >
                        {run.status}
                      </span>
                    </div>

                    {/* Result pills */}
                    {res && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {drug !== "—" && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                              <Pill className="w-3 h-3 text-emerald-400" />
                              {drug}
                            </div>
                          )}
                          {confidence !== undefined && (
                            <div className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              {confidence}% Confidence
                            </div>
                          )}
                          {urgency && urgency !== "—" && (
                            <div
                              className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${urgencyColor}`}
                            >
                              {urgency}
                            </div>
                          )}
                        </div>

                        {/* Patient-friendly summary */}
                        {patientSummary && (
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-emerald-200 pl-3">
                            {patientSummary}
                          </p>
                        )}

                        {/* Outcome + risk */}
                        {(outcome || riskLevel !== "—") && (
                          <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {outcome && (
                              <span>
                                Outcome:{" "}
                                <span className="text-slate-600">
                                  {outcome}
                                </span>
                              </span>
                            )}
                            {riskLevel !== "—" && (
                              <span>
                                Risk:{" "}
                                <span
                                  className={
                                    riskLevel === "low"
                                      ? "text-emerald-600"
                                      : riskLevel === "high" ||
                                          riskLevel === "critical"
                                        ? "text-red-600"
                                        : "text-amber-600"
                                  }
                                >
                                  {riskLevel}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Intelligence Alerts - SIDE TALL BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-1 lg:row-span-4 flex flex-col bg-slate-900 text-white border-slate-800`}
        >
          <div className="p-8 border-b border-slate-800">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
              Intelligence
            </h4>
            <h3 className="text-xl font-bold tracking-tight">System Alerts</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="divide-y divide-slate-800">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Grid Secure
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-6 space-y-3 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">
                        Information
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 uppercase font-mono">
                        {formatRelativeTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-800">
            <Link
              href="/patient/alerts"
              className="block w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Medication Ledger - WIDE BOTTOM BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-3 lg:row-span-2 flex flex-col`}
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className={headerLabelStyle}>Protocols</h4>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Medication Ledger
              </h3>
            </div>
            <button className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 transition-all">
              <Pill className="w-4 h-4" />
            </button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {patient?.medications && patient.medications.length > 0 ? (
              patient.medications.map((med, i) => (
                <div
                  key={i}
                  className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{med.name}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {med.dose} • Since {med.since}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      Active
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-between opacity-40 hover:opacity-100 transition-all grayscale hover:grayscale-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 italic">
                      No medications on record
                    </h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Registry Clear
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Family Communication Layer */}
      <FamilyAssistant
        patientName={user?.name || patient?.name}
        primaryDrug={patient?.medications?.[0]?.name}
        riskLevel={patient?.status}
        predictedOutcome={
          patient?.status === "critical"
            ? "decline"
            : patient?.status === "stable"
              ? "stable"
              : "monitor"
        }
        patientSummary={`${patient?.name || "Patient"} is currently ${
          patient?.status || "under observation"
        } with conditions: ${patient?.conditions?.join(", ") || "N/A"}`}
      />
    </div>
  );
}

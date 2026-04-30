"use client";

import { useEffect, useState } from "react";
import { getAlerts, getMe, getPatient } from "@/lib/api";
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
import type { Alert, Patient, User } from "@/types";
import { FamilyAssistant } from "@/components/shared/FamilyAssistant";

export default function PatientDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cookieUser = getUserFromCookie();
    setUser(cookieUser);
    const fetchData = async () => {
      try {
        const freshUser = await getMe();
        setUser(freshUser);
        const [patientData, alertsData] = await Promise.allSettled([
          getPatient(freshUser.id),
          getAlerts(),
        ]);
        if (patientData.status === "fulfilled") setPatient(patientData.value);
        if (alertsData.status === "fulfilled") setAlerts(alertsData.value);
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
              Last 30 Days
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-inner">
              <Microscope className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.1em] mb-2">
              No active interventions
            </h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold max-w-xs leading-relaxed">
              Diagnostic sensors report baseline stability across all protocols.
            </p>
            <button className="mt-8 px-6 py-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all">
              Request Full Scan
            </button>
          </div>
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

"use client";

import { useEffect, useState } from "react";
import { getPatients, getAlerts, getPipelineRuns } from "@/lib/api";
import { getUserFromCookie } from "@/lib/auth";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Activity,
  Users,
  AlertTriangle,
  Zap,
  Terminal,
  TrendingUp,
  ShieldCheck,
  Globe,
  ChevronRight,
  Clock,
  Calendar,
} from "lucide-react";
import type { Alert, Patient, PipelineRun, User } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function DoctorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUserFromCookie());
    Promise.all([
      getPatients().catch(() => [] as Patient[]),
      getAlerts().catch(() => [] as Alert[]),
      getPipelineRuns().catch(() => [] as PipelineRun[]),
    ]).then(([p, a, r]) => {
      setPatients(p);
      setAlerts(a);
      setPipelineRuns(r);
      setLoading(false);
    });
  }, []);

  const criticalPatients = patients.filter((p) => p.status === "critical");
  const runningPipelines = pipelineRuns.filter(
    (r) => r.status === "running",
  ).length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const cardStyle =
    "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50";
  const headerLabelStyle =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Initialising Intelligence Grid...
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
            <span>Diagnostic Node Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Clinical Intelligence
          </h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Welcome back, Dr. {user?.name?.split(" ")[0] || "User"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              {new Date().toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[120px]">
        {/* Total Patients */}
        <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Total Patients</h4>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {patients.length}
            </span>
            <span className="text-[10px] font-bold text-emerald-500">
              +2 new
            </span>
          </div>
        </div>

        {/* Critical Cases */}
        <div
          className={`${cardStyle} p-6 flex flex-col justify-between border-red-100 bg-red-50/10`}
        >
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Critical Cases</h4>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-red-600">
              {criticalPatients.length}
            </span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>

        {/* Active Pipelines */}
        <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Active Pipelines</h4>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {runningPipelines}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Threads active
            </span>
          </div>
        </div>

        {/* Unread Alerts */}
        <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
          <div className="flex justify-between items-start">
            <h4 className={headerLabelStyle}>Unread Alerts</h4>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {unreadAlerts}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Notifications
            </span>
          </div>
        </div>

        {/* High-Risk Patients - BIG BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-3 lg:row-span-3 flex flex-col`}
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className={headerLabelStyle}>Registry</h4>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                High-Risk Patients
              </h3>
            </div>
            <Link
              href="/doctor/patients"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              View All
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-50">
              {criticalPatients.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    No critical signals detected
                  </p>
                </div>
              ) : (
                criticalPatients.map((p) => (
                  <div
                    key={p.id}
                    className="group p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-black shadow-inner">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {p.age} YRS • {p.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                        CRITICAL
                      </div>
                      <Link
                        href={`/doctor/patients/${p.id}`}
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* System Alerts - SIDE TALL BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-1 lg:row-span-4 flex flex-col`}
        >
          <div className="p-8 border-b border-slate-100">
            <h4 className={headerLabelStyle}>Intelligence</h4>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              System Alerts
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-slate-50">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Grid secure
                  </p>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-6 space-y-3 hover:bg-slate-50/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                          alert.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : alert.severity === "high"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {alert.severity}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300 uppercase font-mono">
                        {formatRelativeTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Pipeline Activity - WIDE BOTTOM BLOCK */}
        <div
          className={`${cardStyle} lg:col-span-3 lg:row-span-2 flex flex-col`}
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className={headerLabelStyle}>Execution</h4>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Pipeline Activity
              </h3>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">
                Real-time sync
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/50">
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Pathogen
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Variant ID
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                  <th className="p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pipelineRuns.slice(0, 5).map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-50/30 transition-all group"
                  >
                    <td className="p-6">
                      <span className="font-bold text-slate-900 uppercase text-xs">
                        {run.pathogen}
                      </span>
                    </td>
                    <td className="p-6 text-[10px] font-mono text-slate-400">
                      {run.variant || "—"}
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <div
                          className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            run.status === "complete"
                              ? "bg-emerald-100 text-emerald-700"
                              : run.status === "running"
                                ? "bg-blue-100 text-blue-700 animate-pulse"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {run.status}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right text-[10px] font-bold text-slate-400 uppercase">
                      {run.createdAt ? formatRelativeTime(run.createdAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getMe, getPatientAlerts, markAlertRead } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import type { Alert } from "@/types";
import {
  Bell,
  Activity,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export default function PatientAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const user = await getMe();
        const data = await getPatientAlerts(user.id);
        setAlerts(data);
      } catch {
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
      );
    } catch {
      // ignore
    }
  };

  const cardStyle =
    "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50 shadow-sm";
  const headerLabelStyle =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-transparent">
        <Activity className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
          <Bell className="w-3.5 h-3.5 animate-pulse" />
          <span>Intelligence Hub Active</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
          Health Alerts
        </h1>
        <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
          Real-time diagnostic signals and system notifications.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div
          className={`${cardStyle} p-20 flex flex-col items-center justify-center text-center bg-emerald-50/10 border-emerald-100`}
        >
          <div className="w-20 h-20 rounded-[2.5rem] bg-white border border-emerald-100 flex items-center justify-center mb-6 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
            Grid Secure
          </h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold max-w-xs leading-relaxed">
            No bio-signals requiring immediate attention detected.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`${cardStyle} p-6 flex items-center justify-between group ${alert.read ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-6">
                <div
                  className={`w-1.5 h-12 rounded-full ${
                    alert.severity === "critical"
                      ? "bg-red-500"
                      : alert.severity === "high"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    {!alert.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    <span className="text-[9px] font-bold text-slate-300 uppercase font-mono">
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {alert.message}
                  </p>
                </div>
              </div>

              {!alert.read && (
                <button
                  onClick={() => handleMarkRead(alert.id)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

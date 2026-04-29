"use client";

import { useEffect, useState } from "react";
import { getAlerts, markAlertRead } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { formatRelativeTime } from "@/lib/utils";
import { Bell, Activity, ShieldCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Alert } from "@/types";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts()
      .then(setAlerts)
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch {
      // ignore
    }
  };

  const cardStyle = "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden transition-all hover:border-slate-300/50";
  const headerLabelStyle = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Initialising Alert Grid...</p>
        </div>
      </div>
    );
  }

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <Bell className="w-3.5 h-3.5" />
            <span>Intelligence Feed Active</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">System Alerts</h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Real-time monitoring of clinical signals and diagnostic alerts.
          </p>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-auto">
        
        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className={`${cardStyle} p-6 flex flex-col justify-between`}>
              <h4 className={headerLabelStyle}>Status</h4>
              <div className="flex items-baseline gap-2 mt-2">
                 <span className="text-3xl font-black text-slate-900">{unreadCount}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unread Signals</span>
              </div>
           </div>

           <div className={`${cardStyle} p-6 flex flex-col justify-between border-red-100 bg-red-50/10`}>
              <h4 className={headerLabelStyle}>Priority</h4>
              <div className="flex items-baseline gap-2 mt-2">
                 <span className="text-3xl font-black text-red-600">{criticalCount}</span>
                 <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Critical Alerts</span>
              </div>
           </div>

           <div className={`${cardStyle} p-8 bg-slate-900 text-white`}>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                 <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-2">Protocol Status</h4>
              <p className="text-[10px] font-bold text-white uppercase leading-relaxed">System is currently scanning clinical pipelines for 12 pathogens.</p>
           </div>
        </div>

        {/* Alerts List - MAIN FEED BLOCK */}
        <div className={`${cardStyle} lg:col-span-3 flex flex-col`}>
           <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <div>
                 <h4 className={headerLabelStyle}>Telemetry</h4>
                 <h3 className="text-xl font-bold tracking-tight text-slate-900">Recent Signals</h3>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 Live Feed
              </div>
           </div>
           
           <ScrollArea className="flex-1 max-h-[700px]">
              <div className="divide-y divide-slate-50">
                {alerts.length === 0 ? (
                  <div className="p-20 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No signals detected in the current window</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className={`p-8 flex items-start gap-8 transition-all hover:bg-slate-50/50 ${!alert.read ? 'bg-emerald-50/10' : ''}`}>
                      <div className="flex-shrink-0 pt-1">
                        <RiskBadge level={alert.severity as any} size="sm" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] font-mono">
                            {alert.alertType} // {formatRelativeTime(alert.createdAt)}
                          </span>
                          {!alert.read && (
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-sm font-bold uppercase leading-relaxed ${alert.read ? 'text-slate-500' : 'text-slate-900'}`}>
                          {alert.message}
                        </p>
                      </div>
                      {!alert.read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex-shrink-0"
                        >
                          ACKNOWLEDGE
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
           </ScrollArea>
        </div>

      </div>
    </div>
  );
}

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
  Calendar
} from "lucide-react";
import type { Alert, Patient, PipelineRun, User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const runningPipelines = pipelineRuns.filter((r) => r.status === "running").length;
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Activity className="w-8 h-8 animate-spin text-primary" />
          <p>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Intelligence</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Welcome back, Dr. {user?.name?.split(" ")[0] || "User"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString("en-US", { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalPatients.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningPipelines}</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadAlerts}</div>
            <p className="text-xs text-muted-foreground">New system notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Critical Patients List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle>High-Risk Patients</CardTitle>
                <CardDescription>Patients requiring immediate review</CardDescription>
              </div>
              <Link href="/doctor/patients" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted hover:text-foreground">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {criticalPatients.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No critical patients at this time.
                </div>
              ) : (
                <div className="divide-y">
                  {criticalPatients.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-muted-foreground">{p.age} yrs • {p.gender}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <RiskBadge level="critical" />
                        <Link href={`/doctor/patients/${p.id}`} className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Status */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Pipeline Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-muted-foreground text-left">
                      <th className="p-4 font-medium">Pathogen</th>
                      <th className="p-4 font-medium">Variant ID</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pipelineRuns.slice(0, 5).map((run) => (
                      <tr key={run.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-medium">{run.pathogen}</td>
                        <td className="p-4 text-muted-foreground">{run.variant || "—"}</td>
                        <td className="p-4">
                          <Badge 
                            variant={run.status === 'complete' ? 'default' : run.status === 'running' ? 'secondary' : 'destructive'}
                          >
                            {run.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {formatRelativeTime(run.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="border-b pb-4">
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Recent intelligence and system notifications</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No active alerts.
                  </div>
                ) : (
                  alerts.slice(0, 8).map((alert) => (
                    <div key={alert.id} className="p-4 space-y-2 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <RiskBadge level={alert.severity as any} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

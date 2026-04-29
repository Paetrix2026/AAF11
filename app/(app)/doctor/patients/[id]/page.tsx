"use client";

import { use, useEffect, useState } from "react";
import { getPatient } from "@/lib/api";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPatient(id)
      .then(setPatient)
      .catch(() => setError("Patient not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading patient details...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-destructive font-medium">{error || "Patient not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground mt-1">Patient ID: {patient.id}</p>
        </div>
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

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Patient Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age ? `${patient.age} years` : "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="font-medium">{patient.gender ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-medium">{patient.location ?? "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient Since</p>
                  <p className="font-medium">{patient.createdAt ? formatDate(patient.createdAt) : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comorbidities</CardTitle>
            </CardHeader>
            <CardContent>
              {!(patient.conditions && patient.conditions.length > 0) ? (
                <p className="text-sm text-muted-foreground">None recorded</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(patient.conditions || []).map((c) => (
                    <Badge key={c} variant="secondary">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {!(patient.medications && patient.medications.length > 0) ? (
                <p className="text-sm text-muted-foreground">None prescribed</p>
              ) : (
                <div className="space-y-4">
                  {(patient.medications || []).map((med, idx) => (
                    <div key={idx} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-muted-foreground">{med.dose}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Since {med.since}</p>
                      {idx < patient.medications.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Pipeline Runner */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>AI Analysis Pipeline</CardTitle>
              <CardDescription>Run diagnostics and generate treatment recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelineRunner patientId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

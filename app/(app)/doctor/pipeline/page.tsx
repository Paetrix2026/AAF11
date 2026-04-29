"use client";

import { useState } from "react";
import { PipelineRunner } from "@/components/pipeline/PipelineRunner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Microscope, Info } from "lucide-react";

export default function PipelinePage() {
  const [patientId, setPatientId] = useState("");
  const [started, setStarted] = useState(false);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Microscope className="w-8 h-8 text-primary" />
          Pipeline Engine
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Run advanced AI analysis, protein docking, and mutation detection pipelines for patients.
        </p>
      </div>

      {!started ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Start Analysis Pipeline</CardTitle>
            <CardDescription>
              Enter a patient UUID to initialize the full diagnostic pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient UUID..."
                className="focus-visible:ring-primary"
              />
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-md mt-4">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Tip:</span> You can also run the analysis directly from a patient's detailed profile page.
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => patientId.trim() && setStarted(true)} 
              disabled={!patientId.trim()}
              className="w-full sm:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              Initialize Pipeline
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Pipeline Running
            </CardTitle>
            <CardDescription>Patient ID: {patientId}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <PipelineRunner patientId={patientId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

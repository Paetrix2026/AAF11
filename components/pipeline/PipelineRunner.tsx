"use client";

import { useState, useRef, useEffect } from "react";
import { runPipeline, streamPipeline, submitOutcome, searchLocal, searchOnline } from "@/lib/api";
import { AgentStepCard } from "./AgentStepCard";
import { PipelineOutput } from "./PipelineOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, RotateCcw, CheckCircle2, AlertCircle, Loader2, Zap, Activity, Info, ChevronRight, Check, Search, RefreshCw, ExternalLink, Database } from "lucide-react";
import type { AgentStep, PipelineResult } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface PipelineRunnerProps {
  patientId: string;
}

const AGENT_SEQUENCE = [
  "PlannerAgent",
  "FetchAgent",
  "MutationParserAgent",
  "StructurePrepAgent",
  "DockingAgent",
  "ADMETAgent",
  "ResistanceAgent",
  "SelectivityAgent",
  "SimilaritySearchAgent",
  "ExplainabilityAgent",
  "ReportAgent",
];

export function PipelineRunner({ patientId }: PipelineRunnerProps) {
  const [pathogen, setPathogen] = useState("");
  const [variant, setVariant] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"effective" | "partial" | "failed" | "">("");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [outcomeSubmitted, setOutcomeSubmitted] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  const extractMutation = (text: string) => {
    const match = text.match(/[A-Z]\d+[A-Z]/);
    return match ? match[0] : "";
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setPathogen(query);
    
    // Auto-extract mutation if found in query
    const extracted = extractMutation(query);
    if (extracted) setVariant(extracted);

    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);
    setSearchResults([]);

    try {
      // Local search
      searchLocal(query).then(localData => {
        setSearchResults(prev => {
          const ids = new Set(prev.map(r => r.id));
          return [...prev, ...localData.filter(r => !ids.has(r.id))];
        });
      });

      // Online search
      const onlineData = await searchOnline(query);
      setSearchResults(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...onlineData.filter(r => !ids.has(r.id))];
      });
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRun = async () => {
    if (running) return; // Prevent double trigger
    
    if (!pathogen.trim()) {
      setError("Please specify target pathogen.");
      toast.error("Biological Target required");
      return;
    }
    
    console.log(`[PIPELINE] Initializing run for Pathogen: ${pathogen}, Variant: ${variant}`);
    setError("");
    setRunning(true);
    setResult(null);
    setOutcome("");
    setOutcomeSubmitted(false);

    const initialSteps: AgentStep[] = AGENT_SEQUENCE.map((name) => ({
      agentName: name,
      status: "pending",
      message: "",
    }));
    setSteps(initialSteps);

    try {
      const res = await runPipeline({
        patientId,
        pathogen: pathogen.trim(),
        variant: variant.trim() || undefined,
        symptoms: symptoms
          ? symptoms.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      
      if (!res?.runId) {
        throw new Error("No Run ID returned from compute node");
      }
      
      console.log(`[PIPELINE] Run ID established: ${res.runId}`);
      setRunId(res.runId);

      esRef.current = streamPipeline(res.runId, (rawData) => {
        try {
          const update = JSON.parse(rawData);
          console.log(`[SSE] Telemetry Update:`, update);
          
          if (update.done && update.result) {
            setResult(update.result);
            setRunning(false);
            esRef.current?.close();
            toast.success("Clinical Sequence Complete");
            return;
          }
          
          if (update.error) {
            setError(update.error);
            setRunning(false);
            esRef.current?.close();
            toast.error(`Sequence Error: ${update.error}`);
            return;
          }

          if (update.agent) {
            setSteps((prev) =>
              prev.map((s) =>
                s.agentName === update.agent
                  ? {
                      ...s,
                      status: update.status ?? "running",
                      message: update.message ?? s.message,
                    }
                  : s
              )
            );
          }
        } catch (e) {
          console.warn("[SSE] Failed to parse message", e);
        }
      });

      esRef.current.onerror = (e) => {
        console.error("[SSE] Connection lost", e);
        setRunning(false);
        esRef.current?.close();
        toast.error("Telemetry connection lost");
      };
    } catch (err) {
      console.error("[PIPELINE] Run error:", err);
      setError(err instanceof Error ? err.message : "Deployment failure");
      setRunning(false);
      toast.error(err instanceof Error ? err.message : "Pipeline initialization failed");
    }
  };

  const handleSubmitOutcome = async () => {
    if (!outcome || !runId) return;
    try {
      await submitOutcome(runId, outcome, outcomeNotes);
      setOutcomeSubmitted(true);
    } catch {}
  };

  return (
    <div className="bg-white">
      {/* Input Stage */}
      {!running && !result && (
        <div className="p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4 relative">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Biological Target Identifier</Label>
              <div className="relative group">
                <Input
                  value={pathogen}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="SEARCH PATHOGEN OR GENE..."
                  className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-lg px-6 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all shadow-sm"
                />
                {searchLoading && (
                   <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && (pathogen.length >= 2 || searchResults.length > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden z-[100] shadow-2xl"
                  >
                    <div className="grid grid-cols-2 divide-x divide-slate-100 h-[320px]">
                      {/* Left: Local */}
                      <div className="flex flex-col min-w-0">
                        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Local Vault</span>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-2 space-y-1">
                            {searchResults.filter(r => r.source === 'local').length === 0 ? (
                              <div className="py-12 text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                                {searchLoading ? "Scanning Vault..." : "No Local Data"}
                              </div>
                            ) : (
                              searchResults.filter(r => r.source === 'local').map((res, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setPathogen(res.name);
                                    setSearchQuery(res.name);
                                    setShowSearchResults(false);
                                    const ext = extractMutation(res.name) || extractMutation(res.description || "");
                                    if (ext) setVariant(ext);
                                    toast.success(`Target Locked: ${res.name}`);
                                  }}
                                  className="w-full p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                                >
                                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider truncate">{res.name}</div>
                                  <div className="text-[8px] text-slate-400 font-medium uppercase truncate mt-1">{res.description}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Right: Online */}
                      <div className="flex flex-col min-w-0">
                        <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Repo</span>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="p-2 space-y-1">
                            {searchResults.filter(r => r.source === 'online').length === 0 ? (
                              <div className="py-12 text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                                {searchLoading ? "UniProt Consulting..." : "No Global Results"}
                              </div>
                            ) : (
                              searchResults.filter(r => r.source === 'online').map((res, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setPathogen(res.id);
                                    setSearchQuery(res.name);
                                    setShowSearchResults(false);
                                    const ext = extractMutation(res.name) || extractMutation(res.description || "");
                                    if (ext) setVariant(ext);
                                    toast.success(`Online Target Locked: ${res.name}`);
                                  }}
                                  className="w-full p-3 rounded-xl hover:bg-slate-50 transition-all text-left group"
                                >
                                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider truncate">{res.name}</div>
                                  <div className="text-[8px] text-slate-400 font-medium uppercase truncate mt-1">{res.description}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                      <button onClick={() => setShowSearchResults(false)} className="text-[8px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Close Discovery Matrix</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-4">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Mutation Signature</Label>
              <Input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. T271A, D614G..."
                className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-lg px-6 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Clinical Symptoms</Label>
            <Input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Fever, cough, fatigue..."
              className="h-16 bg-slate-50 border-none rounded-2xl font-bold text-lg px-6 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all shadow-sm"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-red-50 rounded-2xl flex items-center gap-4 text-red-600 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-bold text-xs uppercase tracking-wider">{error}</p>
            </motion.div>
          )}

          <Button
            type="button"
            onClick={handleRun}
            disabled={running || !pathogen.trim()}
            className="w-full h-20 bg-emerald-500 text-white rounded-3xl font-bold text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
          >
            {running ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 mr-3 fill-current" />
            )}
            {running ? "Sequence Initializing..." : "Establish Neural Run"}
          </Button>
        </div>
      )}

      {/* Execution Stage */}
      {(running || result) && steps.length > 0 && (
        <div className="p-0">
          <div className="bg-slate-50/50 p-8 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-900" />
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">Sequence Telemetry</h3>
            </div>
            {running && (
              <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Processing Node</span>
              </div>
            )}
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 bg-slate-50/30">
            {steps.map((step, idx) => (
              <AgentStepCard key={step.agentName} step={step} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* Output / Report Stage */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="bg-white"
        >
          <PipelineOutput result={result} />

          {/* Clinical Verification Bento Card */}
          <div className="p-12 bg-slate-50/50 border-t border-slate-100">
            {!outcomeSubmitted ? (
              <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="p-10 space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold tracking-tight">Clinical Efficacy Report</h4>
                        <p className="text-slate-400 text-xs font-medium">Record observation outcome for system calibration</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["effective", "partial", "failed"] as const).map((o) => (
                      <button
                        key={o}
                        onClick={() => setOutcome(o)}
                        className={`p-6 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-3 ${
                          outcome === o 
                            ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20" 
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${outcome === o ? "bg-emerald-500" : "bg-slate-50"}`}>
                           {outcome === o && <Check className="w-4 h-4 text-white" />}
                        </div>
                        {o}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Supplemental Observations</Label>
                    <Input
                      placeholder="Enter clinical notes..."
                      value={outcomeNotes}
                      onChange={(e) => setOutcomeNotes(e.target.value)}
                      className="h-16 bg-slate-50 border-none rounded-2xl font-semibold text-sm px-6 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      onClick={handleSubmitOutcome}
                      disabled={!outcome}
                      className="flex-1 h-16 bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                      Commit Outcome
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setResult(null);
                        setSteps([]);
                        setRunId(null);
                      }}
                      className="h-16 px-10 text-slate-400 hover:text-slate-900 font-bold text-sm transition-all"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Re-Initialize
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto p-12 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col items-center text-center space-y-8 border border-slate-50">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30">
                   <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                   <h3 className="text-2xl font-bold tracking-tight">Data Synchronized</h3>
                   <p className="text-sm font-medium text-slate-400 mt-2">Observation sequence complete and stored</p>
                </div>
                <Button 
                   onClick={() => {
                      setResult(null);
                      setSteps([]);
                      setRunId(null);
                   }}
                   className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
                >
                   Return to Terminal
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

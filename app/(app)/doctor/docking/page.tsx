"use client";

import { useState, useEffect } from "react";
import { 
  Microscope, 
  Upload, 
  Activity, 
  Terminal, 
  FileText, 
  Zap, 
  Info,
  ChevronRight,
  Database,
  FlaskConical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getScreeningCompounds } from "@/lib/api";
import { Molecule3DViewer } from "@/components/molecules/Molecule3DViewer";

export default function DockingPage() {
  const [pdbId, setPdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [target, setTarget] = useState("");
  const [activeTab, setActiveTab] = useState("receptor");

  // Grid box parameters
  const [grid, setGrid] = useState({
    cx: 0, cy: 0, cz: 0,
    sx: 30, sy: 30, sz: 30
  });

  const targets = [
    { name: "H5N1 Avian Flu", id: "H5N1", pdb: "4WSB" },
    { name: "SARS-CoV-2 Mpro", id: "SARS-CoV-2", pdb: "7BV2" },
    { name: "H1N1 Swine Flu", id: "H1N1", pdb: "3BEQ" },
    { name: "Influenza A NA", id: "Influenza A", pdb: "4WSB" },
  ];

  useEffect(() => {
    getScreeningCompounds().then(res => {
      // Logic for compounds removed
    });
  }, []);

  const handleRunDocking = async () => {
    if (!pdbId && !target) {
      toast.error("Please provide a PDB ID or select a target");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (pdbId) formData.append("pdb_id", pdbId);
      if (target) formData.append("target", target);
      // We are ignoring SMILES for now as requested
      formData.append("smiles", "C"); // Dummy ligand to keep Vina happy if needed
      formData.append("center_x", grid.cx.toString());
      formData.append("center_y", grid.cy.toString());
      formData.append("center_z", grid.cz.toString());
      formData.append("size_x", grid.sx.toString());
      formData.append("size_y", grid.sy.toString());
      formData.append("size_z", grid.sz.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dock`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast.success("Structural analysis complete");
        setActiveTab("results");
      } else {
        toast.error(data.message || "Simulation failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during simulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 space-y-8 animate-in fade-in duration-700 overflow-y-auto">
      {/* Header - Simplified for visibility */}
      <div className="flex items-center justify-between border-b-4 border-primary pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-primary-foreground">
            <Microscope className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase italic leading-none">
              Pathogen <span className="text-primary not-italic">Analyzer</span>
            </h1>
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase mt-1">
              Structural Prep • AutoDock Vina v1.2.5
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="px-4 py-2 bg-muted border-2 border-primary/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase">Online</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 min-h-[800px]">
        {/* Left Sidebar: Analysis Config */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 shrink-0">
          <Card className="border-4 border-foreground rounded-none flex flex-col h-full bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="w-full h-14 rounded-none bg-muted p-0 border-b-4 border-foreground">
                <TabsTrigger 
                  value="receptor" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background text-[11px] font-black uppercase tracking-widest"
                >
                  Target
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex-1 h-full rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background text-[11px] font-black uppercase tracking-widest"
                  disabled={!result}
                >
                  Analysis
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  <TabsContent value="receptor" className="mt-0 space-y-8">
                    {/* Pre-mapped selection */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Priority Pathogens</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {targets.map((t) => (
                          <Button
                            key={t.id}
                            variant={target === t.id ? "default" : "outline"}
                            className={`h-12 rounded-none border-2 font-black uppercase text-[10px] justify-between px-4 transition-none ${
                              target === t.id ? 'border-primary' : 'hover:border-foreground'
                            }`}
                            onClick={() => {
                              setTarget(t.id);
                              setPdbId(t.pdb);
                              toast.success(`Target: ${t.id}`);
                            }}
                          >
                            {t.id}
                            <div className={`w-2 h-2 rounded-full ${target === t.id ? 'bg-primary-foreground' : 'bg-muted-foreground/20'}`} />
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-[2px] bg-muted" />
                      <span className="text-[9px] font-black text-muted-foreground uppercase italic">Manual Entry</span>
                      <div className="flex-1 h-[2px] bg-muted" />
                    </div>

                    {/* Disease search */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pathogen Name</Label>
                      <div className="relative">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="SEARCH PATHOGEN" 
                          value={pdbId}
                          onChange={(e) => {
                            setPdbId(e.target.value.toUpperCase());
                            setTarget("");
                          }}
                          className="pl-12 h-14 bg-muted/20 border-2 border-foreground/10 rounded-none font-mono font-bold text-base uppercase"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0 space-y-6">
                    {result && (
                      <div className="space-y-6">
                        <div className="p-6 border-4 border-primary bg-primary/5 text-center">
                          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Structure Loaded</div>
                          <div className="text-4xl font-black uppercase italic leading-none">{result.pdb_id}</div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between p-3 border-2 border-foreground/5 bg-muted/10 text-[10px] font-bold">
                            <span>PROTEIN_CLEAN</span>
                            <span className="text-green-600">DONE</span>
                          </div>
                          <div className="flex justify-between p-3 border-2 border-foreground/5 bg-muted/10 text-[10px] font-bold">
                            <span>HYDROGEN_ADD</span>
                            <span className="text-green-600">DONE</span>
                          </div>
                        </div>

                        <div className="p-4 bg-foreground text-background font-mono text-[9px] leading-relaxed">
                          {`> PATHOGEN: ${result.target || "OK"}\n> VINA_PDBQT: GENERATED\n> DOCKING_READY: TRUE`}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>

              <div className="p-4 border-t-4 border-foreground bg-muted/20">
                <Button 
                  onClick={handleRunDocking} 
                  disabled={loading || (!pdbId && !target)}
                  className="w-full h-16 rounded-none text-base font-black uppercase italic tracking-widest transition-none"
                >
                  {loading ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2 fill-current" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Right Section: Visualization */}
        <div className="flex-1 flex flex-col gap-6 h-full min-h-[600px]">
          <Card className="flex-1 border-4 border-foreground rounded-none bg-black relative overflow-hidden flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]">
            {/* Viewport UI */}
            <div className="absolute top-6 left-6 z-20 space-y-2 pointer-events-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-md">Simulation Core v1.2</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
              
              {!result ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 border-2 border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Microscope className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Initializing Viewport</h3>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Select pathogen target to begin structural simulation</p>
                </div>
              ) : (
                <div className="w-full h-full p-4">
                  <Molecule3DViewer 
                    pdbData={result.pdb_content} 
                    height={500} 
                  />
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-6 border-t-2 border-white/5 bg-zinc-950 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Viewport Status</span>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Stable</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10 mx-2" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">PDB_Source</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">RCSB</span>
                </div>
              </div>

              {result && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-none border-2 border-white/10 bg-transparent text-white text-[9px] font-black h-10 px-4 transition-none hover:bg-white hover:text-black">
                    EXPORT_LOG
                  </Button>
                  <Button size="sm" className="rounded-none bg-primary text-primary-foreground text-[9px] font-black h-10 px-4 transition-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
                    DOWNLOAD_PDBQT
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border-l-4 border-primary bg-muted/10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Automated Normalization</h4>
              <p className="text-[9px] text-muted-foreground font-bold leading-relaxed uppercase">
                Structural targets are automatically stripped of non-protein residues and optimized for the simulation box center.
              </p>
            </div>
            <div className="p-6 border-l-4 border-foreground bg-muted/10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Compute Priority</h4>
              <span className="text-[10px] font-black text-primary uppercase animate-pulse">Running on Cluster_A1...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

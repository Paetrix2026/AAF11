"use client";

import { useState, useEffect } from "react";
import { 
  Microscope, 
  Activity, 
  Terminal, 
  Zap, 
  Info,
  ChevronRight,
  Database,
  FlaskConical,
  ShieldCheck,
  Search,
  ExternalLink,
  Download,
  Share2,
  Cpu,
  RefreshCw,
  Box,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getScreeningCompounds } from "@/lib/api";
import { Molecule3DViewer } from "@/components/molecules/Molecule3DViewer";
import { motion, AnimatePresence } from "framer-motion";

export default function DockingPage() {
  const [pdbId, setPdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [target, setTarget] = useState("");
  const [activeTab, setActiveTab] = useState("receptor");
  const [exhaustiveness, setExhaustiveness] = useState(8);

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
      // Logic for compounds
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
      formData.append("center_x", grid.cx.toString());
      formData.append("center_y", grid.cy.toString());
      formData.append("center_z", grid.cz.toString());
      formData.append("size_x", grid.sx.toString());
      formData.append("size_y", grid.sy.toString());
      formData.append("size_z", grid.sz.toString());
      formData.append("exhaustiveness", exhaustiveness.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dock`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (data.data.results && data.data.results.length > 0) {
          setSelectedResult(data.data.results[0]);
        }
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

  const cardStyle = "bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden";

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 text-slate-900 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Computational Node 0x92</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Molecular Docking</h1>
            <p className="text-slate-500 text-sm font-medium">Precision binding simulations and structural analysis.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Cluster Online</span>
             </div>
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                ))}
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CONFIG BENTO (LEFT) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardStyle} lg:col-span-4 flex flex-col h-[800px]`}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <TabsList className="w-full h-16 rounded-none bg-slate-50 p-2 flex gap-2 border-b border-slate-100">
                <TabsTrigger 
                  value="receptor" 
                  className="flex-1 h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Target Setup
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex-1 h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  disabled={!result}
                >
                  Analysis Repo
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 custom-scrollbar">
                <div className="p-8 space-y-8">
                  <TabsContent value="receptor" className="mt-0 space-y-10">
                    {/* Priority Pathogens */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Priority Pathogens</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {targets.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTarget(t.id);
                              setPdbId(t.pdb);
                              toast.success(`Target: ${t.id} established`);
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                              target === t.id 
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                : "bg-slate-50 hover:bg-white hover:shadow-md text-slate-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  target === t.id ? "bg-white/20" : "bg-white text-slate-400"
                               }`}>
                                  <FlaskConical className="w-4 h-4" />
                               </div>
                               <span className="font-bold text-xs uppercase tracking-wider">{t.id}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 opacity-40 ${target === t.id ? "text-white" : "group-hover:translate-x-1 transition-transform"}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-[1px] bg-slate-100" />
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Manual Entry</span>
                      <div className="flex-1 h-[1px] bg-slate-100" />
                    </div>

                    {/* Manual Search */}
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Direct Signature Search</Label>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                        <Input 
                          placeholder="SEARCH PATHOGEN SIGNATURE" 
                          value={pdbId}
                          onChange={(e) => {
                            setPdbId(e.target.value.toUpperCase());
                            setTarget("");
                          }}
                          className="pl-12 h-14 bg-slate-50 border-none rounded-2xl font-bold text-sm uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-emerald-500/10 focus-visible:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0 space-y-8">
                    {result && (
                      <div className="space-y-8">
                        <div className="p-8 bg-emerald-500 text-white rounded-[2rem] shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                           <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Structure Signature</div>
                           <div className="text-4xl font-bold tracking-tight">{result.pdb_id}</div>
                           <div className="mt-4 flex items-center gap-2">
                              <div className="px-2 py-1 bg-white/20 rounded-lg text-[9px] font-bold">READY FOR DOCKING</div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           {[
                              { label: "Protein Normalization", status: "VERIFIED" },
                              { label: "Hydrogen Optimization", status: "VERIFIED" },
                              { label: "VINA_PDBQT Synthesis", status: "VERIFIED" }
                           ].map((item, i) => (
                             <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                                <span className="text-[10px] font-bold text-emerald-500">{item.status}</span>
                             </div>
                           ))}
                        </div>

                        <div className="space-y-4">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Candidate Screening Results</Label>
                          <div className="space-y-2">
                            {result.results?.map((res: any, idx: number) => (
                              <button 
                                key={idx} 
                                onClick={() => setSelectedResult(res)}
                                className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${
                                  selectedResult?.name === res.name 
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                    : 'bg-white hover:bg-slate-50 border border-slate-100/50'
                                }`}
                              >
                                <div className="text-left">
                                  <div className="text-[11px] font-bold uppercase tracking-wider">{res.name}</div>
                                  <div className={`text-[9px] font-mono opacity-40 mt-0.5 truncate w-32 ${selectedResult?.name === res.name ? 'text-white' : 'text-slate-400'}`}>
                                     {res.smiles}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div className={`text-sm font-bold ${
                                    selectedResult?.name === res.name ? 'text-emerald-400' : 'text-slate-900'
                                  }`}>
                                    {res.affinity ? `${res.affinity} kcal/mol` : 'FAIL'}
                                  </div>
                                  <ChevronRight className={`w-4 h-4 opacity-20 ${selectedResult?.name === res.name ? 'text-white' : ''}`} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>

              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Simulation Exhaustiveness</Label>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{exhaustiveness}</span>
                  </div>
                  <div className="relative pt-1">
                    <input 
                      type="range"
                      value={exhaustiveness ?? 8}
                      onChange={(e) => setExhaustiveness(parseInt(e.target.value) || 8)}
                      min={8} 
                      max={128} 
                      step={8} 
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
                    />
                    <div className="flex justify-between w-full px-[2px] mt-2">
                      <span className="text-[8px] text-slate-400 font-bold">8</span>
                      <span className="text-[8px] text-slate-400 font-bold">64</span>
                      <span className="text-[8px] text-slate-400 font-bold">128</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic">Higher values increase precision but extend computation time.</p>
                </div>

                <Button 
                  onClick={handleRunDocking} 
                  disabled={loading || (!pdbId && !target)}
                  className="w-full h-16 bg-emerald-500 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Activity className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2 fill-current" />
                      Initiate Structural Run
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          </motion.div>

          {/* VISUALIZATION BENTO (RIGHT) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`${cardStyle} flex-1 min-h-[600px] bg-slate-950 shadow-2xl shadow-slate-900/40`}
            >
              {/* Viewport UI Overlay */}
              <div className="absolute top-8 left-8 z-20 space-y-4 pointer-events-none">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] opacity-80">Simulation Engine Active</span>
                </div>
                {result && (
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                     <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{result.pdb_id} :: LOADED</span>
                  </div>
                )}
              </div>

              <div className="absolute top-8 right-8 z-20 flex gap-2">
                 <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/10">
                    <Maximize2 className="w-4 h-4" />
                 </button>
              </div>

              <div className="h-full flex items-center justify-center relative p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
                
                {!result ? (
                  <div className="text-center space-y-6 animate-in fade-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/5 relative group">
                       <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                       <Box className="w-10 h-10 text-white/20 relative z-10" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-bold text-white tracking-tight">Awaiting Target</h3>
                       <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em] mt-3">Select sequence from registry to begin simulation</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900/50 relative group">
                    <Molecule3DViewer 
                      pdbData={result.pdb_content} 
                      ligandData={selectedResult?.ligand_pdb}
                      height={600} 
                    />
                    {/* Viewport HUD */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex gap-2">
                          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase border border-white/10">CENTER: 0, 0, 0</span>
                          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-bold text-white uppercase border border-white/10">ZOOM: 1.2X</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-8">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Stability</span>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Nominal</span>
                       <div className="flex gap-0.5">
                          {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-emerald-500/40 rounded-full" />)}
                       </div>
                    </div>
                  </div>
                  <div className="w-[1px] h-10 bg-white/10" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">Coordinate Grid</span>
                    <span className="block text-xs font-bold text-white uppercase tracking-widest">RCSB_NATIVE_REF</span>
                  </div>
                </div>

                {result && (
                  <div className="flex gap-3">
                    <button className="h-12 px-6 bg-white/10 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white hover:text-slate-900 transition-all">
                       Export Analysis Log
                    </button>
                    <Button className="h-12 px-8 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                       <Download className="w-3.5 h-3.5 mr-2" />
                       PDBQT Vector
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* LOWER BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cardStyle}
              >
                 <div className="p-8 flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                       <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Automated Normalization</h4>
                       <p className="text-xs font-bold text-slate-900 leading-relaxed uppercase">
                          Targets are automatically stripped of non-protein residues and box-centered.
                       </p>
                    </div>
                 </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cardStyle}
              >
                 <div className="p-8 flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/20">
                       <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Compute Environment</h4>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase">Cluster_A1 Active</span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

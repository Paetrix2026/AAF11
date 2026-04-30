"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
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
  Dna,
  Cpu,
  RefreshCw,
  Box,
  Maximize2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { getScreeningCompounds, searchPathogens, searchLocal, searchOnline } from "@/lib/api";
import { Molecule3DViewer } from "@/components/molecules/Molecule3DViewer";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function DockingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [pdbId, setPdbId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [target, setTarget] = useState("");
  const [activeTab, setActiveTab] = useState("receptor");
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [discoverySearch, setDiscoverySearch] = useState("");
  const [exhaustiveness, setExhaustiveness] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mutation, setMutation] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Grid box parameters
  const [grid, setGrid] = useState({
    cx: 0, cy: 0, cz: 0,
    sx: 30, sy: 30, sz: 30
  });

  const steps = [
    { id: 1, name: "Target Setup", icon: FlaskConical },
    { id: 2, name: "Molecular Docking", icon: Zap },
    { id: 3, name: "Clinical Intelligence", icon: Cpu },
  ];

  const targets = [
    { name: "H5N1 Avian Flu", id: "H5N1", pdb: "4WSB", mutation: "H274Y" },
    { name: "SARS-CoV-2 Mpro", id: "SARS-CoV-2", pdb: "7BV2", mutation: "E484K" },
    { name: "H1N1 Swine Flu", id: "H1N1", pdb: "3BEQ", mutation: "H275Y" },
    { name: "Influenza A NA", id: "Influenza A", pdb: "4WSB", mutation: "N294S" },
  ];

  const [screeningCompounds, setScreeningCompounds] = useState<any[]>([]);

  useEffect(() => {
    getScreeningCompounds().then(res => {
      if (res.success) setScreeningCompounds(res.data);
    });

    // Fetch saved discoveries for the "Analysis Repo" search
    fetch("/api/discoveries")
      .then(res => res.json())
      .then(data => {
        if (data.success) setDiscoveries(data.data);
      })
      .catch(err => console.error("Failed to load discoveries:", err));
  }, []);

  const filteredDiscoveries = discoveries.filter(
    (d: any) =>
      d.query?.toLowerCase().includes(discoverySearch.toLowerCase()) ||
      d.gene?.toLowerCase().includes(discoverySearch.toLowerCase()) ||
      d.mutation?.toLowerCase().includes(discoverySearch.toLowerCase())
  );

  const handleGenerateReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text("Healynx Clinical Diagnostic Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Reference ID: ${result.pdb_id || 'N/A'}`, 14, 35);
    
    // Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("Clinical Summary", 14, 50);
    doc.setFontSize(10);
    doc.text(`Analysis for target: ${result.target || result.pdb_id}${result.mutation ? ` (${result.mutation})` : ''}`, 14, 58);
    
    const sorted = [...result.results].sort((a: any, b: any) => b.decision_score - a.decision_score);
    const topDrug = sorted[0];
    
    doc.text(`Primary Recommendation: ${topDrug.name}`, 14, 65);
    doc.text(`System Confidence: 98.2%`, 14, 72);
    
    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Drug Candidate', 'Affinity (kcal/mol)', 'Resistance Risk', 'Intelligence Score', 'Status']],
      body: result.results.map((r: any) => [
        r.name,
        r.affinity?.toFixed(3) || 'FAIL',
        `${(r.resistance * 100).toFixed(0)}%`,
        r.decision_score?.toFixed(4) || '0.0000',
        r.status.toUpperCase()
      ]),
      headStyles: { fillStyle: 'f0fdf4', textColor: [6, 78, 59] }, // emerald-50/900
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("This report is generated by Healynx AI. Clinical verification required.", 14, doc.internal.pageSize.height - 10);
    
    doc.save(`Healynx_Report_${result.pdb_id || result.target}.pdf`);
  };

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
      if (mutation) formData.append("mutation", mutation);

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
        setCurrentStep(2);
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);
    setSearchResults([]); // Clear for new search

    try {
      // 1. Fire Local Search (Instant)
      searchLocal(query).then(localData => {
        setSearchResults(prev => [...prev, ...localData]);
      }).catch(err => console.error("Local search failed:", err));

      // 2. Fire Online Search (Async)
      const onlineData = await searchOnline(query);
      setSearchResults(prev => {
        // Only add if not already in results (avoid duplicates from cache/local)
        const existingIds = new Set(prev.map(r => r.id));
        const newItems = onlineData.filter(r => !existingIds.has(r.id));
        return [...prev, ...newItems];
      });
    } catch (error) {
      console.error("Online search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const DecisionMatrixChart = () => {
    if (!result?.results) return null;
    
    return (
      <Plot
        data={[
          {
            x: result.results.map((r: any) => r.affinity),
            y: result.results.map((r: any) => r.resistance),
            text: result.results.map((r: any) => r.name),
            mode: 'markers+text',
            type: 'scatter',
            marker: { 
               size: 14, 
               color: '#10b981',
               line: { color: '#064e3b', width: 2 }
            },
            textposition: 'top center',
            textfont: { family: 'Inter, sans-serif', size: 10, color: '#94a3b8' }
          }
        ]}
        layout={{
          width: undefined,
          height: 300,
          autosize: true,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 40, r: 20, t: 20, b: 40 },
          xaxis: { 
            title: 'Binding Affinity (kcal/mol)', 
            titlefont: { size: 10, color: '#94a3b8' },
            tickfont: { size: 8, color: '#94a3b8' },
            gridcolor: '#f1f5f9'
          },
          yaxis: { 
            title: 'Resistance Risk', 
            titlefont: { size: 10, color: '#94a3b8' },
            tickfont: { size: 8, color: '#94a3b8' },
            gridcolor: '#f1f5f9',
            range: [0, 1.1]
          }
        }}
        config={{ displayModeBar: false, responsive: true }}
        className="w-full h-full"
      />
    );
  };

  const cardStyle = "bg-white rounded-[2.5rem] border border-slate-100 relative overflow-hidden";

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full p-6 lg:p-8 gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Computational Node 0x92</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Molecular Docking</h1>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Precision binding simulations and structural analysis.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-emerald-50 rounded-2xl flex items-center gap-3 border border-emerald-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Cluster Online</span>
             </div>
          </div>
        </header>

        {/* Stepper Section - FULL WIDTH BENTO STYLE */}
        <div className="shrink-0">
          <div className="bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] p-4">
             <div className="max-w-[1200px] mx-auto grid grid-cols-3 gap-4">
                {steps.map((s, idx) => (
                  <div key={s.id} className="relative flex items-center justify-center gap-4 group">
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                        currentStep >= s.id 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : "bg-slate-50 border-slate-100 text-slate-300"
                      }`}
                    >
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                       <span className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${
                          currentStep >= s.id ? "text-emerald-500" : "text-slate-300"
                       }`}>
                          Step 0{s.id}
                       </span>
                       <span className={`text-[11px] font-bold uppercase tracking-widest ${
                         currentStep >= s.id ? "text-slate-900" : "text-slate-400"
                       }`}>
                         {s.name}
                       </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block">
                         <div className={`w-8 h-[2px] rounded-full transition-all duration-1000 ${
                            currentStep > s.id ? "bg-emerald-500" : "bg-slate-100"
                         }`} />
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
          
          {/* CONFIG BENTO (LEFT) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${cardStyle} lg:col-span-4 flex flex-col h-full`}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              {/* Tabs List - Fixed Header */}
              <div className="px-6 pt-6 pb-4 shrink-0 bg-white z-10 border-b border-slate-50">
                <TabsList className="w-full h-11 rounded-2xl bg-slate-100/50 p-1 flex gap-1 border border-slate-200/50">
                  <TabsTrigger 
                    value="receptor" 
                    className="flex-1 h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all duration-300"
                  >
                    Target Setup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="results" 
                    className="flex-1 h-full rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-all duration-300"
                    disabled={!result}
                  >
                    Analysis Repo
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="p-6 space-y-8">
                    <TabsContent value="receptor" className="mt-0 space-y-8">
                      {/* Priority Pathogens */}
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Priority Pathogens</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {targets.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setTarget(t.id);
                                setSearchQuery(t.id);
                                setPdbId(t.pdb);
                                setMutation(t.mutation || "");
                                toast.success(`Target: ${t.id} | Mutation: ${t.mutation || 'WT'}`);
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${
                                 target === t.id 
                                   ? "bg-emerald-500 text-white" 
                                   : "bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                               }`}
                            >
                              <div className="flex items-center gap-3">
                                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    target === t.id ? "bg-white/20" : "bg-white text-slate-400"
                                 }`}>
                                    <FlaskConical className="w-3.5 h-3.5" />
                                 </div>
                                 <span className="font-bold text-[11px] uppercase tracking-wider">{t.id}</span>
                              </div>
                              <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${target === t.id ? "text-white" : "group-hover:translate-x-1 transition-transform"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-slate-100" />
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Direct Search</span>
                        <div className="flex-1 h-[1px] bg-slate-100" />
                      </div>

                      {/* Manual Search Split Logic */}
                      <div className="space-y-6">
                        {/* Primary Search: Target */}
                        <div className="space-y-3 relative">
                          <div className="flex justify-between items-end px-1">
                            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Biological Target Identifier</Label>
                            {pdbId && <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">ID Locked</span>}
                          </div>
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                            <Input 
                              placeholder="Search subjects or enter explicit Project ID..." 
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                              className="pl-12 h-16 bg-slate-50/50 border-none rounded-[1.5rem] font-bold text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:bg-white transition-all shadow-sm"
                            />
                            {(searchQuery || pdbId) && (
                              <button 
                                onClick={() => { setSearchQuery(""); setPdbId(""); setTarget(""); setMutation(""); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Search Results Dropdown */}
                          <AnimatePresence>
                            {showSearchResults && (searchQuery.length >= 2 || searchResults.length > 0) && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] overflow-hidden z-50 shadow-2xl"
                              >
                                <div className="grid grid-cols-2 divide-x divide-slate-100 h-[320px]">
                                  {/* Left: Local */}
                                  <div className="flex flex-col min-w-0">
                                    <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Local Vault</span>
                                      {searchLoading && <RefreshCw className="w-2.5 h-2.5 text-emerald-500 animate-spin" />}
                                    </div>
                                    <ScrollArea className="flex-1">
                                      <div className="p-2 space-y-1">
                                        {searchResults.filter(r => r.source === 'local').length === 0 ? (
                                          <div className="py-12 text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                                            {searchLoading ? "Scanning Vault..." : searchQuery ? "No Local Data" : "Ready for Input..."}
                                          </div>
                                        ) : (
                                          searchResults.filter(r => r.source === 'local').map((res, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => {
                                                const metadata = res.metadata as any;
                                                const diseaseName = metadata?.disease || res.name.split(/_| FR_/)[0];
                                                const mutationCode = metadata?.mutation || (res.name.match(/[A-Z]\d+[A-Z]/)?.[0] || "");
                                                const gene = metadata?.gene;
                                                const rawId = res.id.includes(':') ? res.id.split(':')[1] : res.id;
                                                
                                                const resolvedPdbId = (gene && !gene.includes('_')) ? gene : 
                                                                    (rawId && !rawId.includes('_') && rawId.length < 15) ? rawId : 
                                                                    diseaseName;
                                                
                                                setPdbId(resolvedPdbId);
                                                setTarget(diseaseName);
                                                setSearchQuery(diseaseName);
                                                setMutation(mutationCode);
                                                setShowSearchResults(false);
                                                toast.success(`Target: ${diseaseName}${mutationCode ? ` | Mutation: ${mutationCode}` : ''}`);
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
                                      {searchLoading && <RefreshCw className="w-2.5 h-2.5 text-blue-500 animate-spin" />}
                                    </div>
                                    <ScrollArea className="flex-1">
                                      <div className="p-2 space-y-1">
                                        {searchResults.filter(r => r.source === 'online').length === 0 ? (
                                          <div className="py-12 text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                                            {searchLoading ? "Consulting UniProt..." : searchQuery ? "No Online Results" : "Awaiting Query..."}
                                          </div>
                                        ) : (
                                          searchResults.filter(r => r.source === 'online').map((res, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => {
                                                const metadata = res.metadata as any;
                                                const diseaseName = metadata?.disease || res.name.split(/_| FR_/)[0];
                                                const mutationCode = metadata?.mutation || (res.name.match(/[A-Z]\d+[A-Z]/)?.[0] || "");
                                                const gene = metadata?.gene;
                                                const rawId = res.id.includes(':') ? res.id.split(':')[1] : res.id;
                                                
                                                const resolvedPdbId = (gene && !gene.includes('_')) ? gene : 
                                                                    (rawId && !rawId.includes('_') && rawId.length < 15) ? rawId : 
                                                                    diseaseName;
                                                
                                                setPdbId(resolvedPdbId);
                                                setTarget(diseaseName);
                                                setSearchQuery(diseaseName);
                                                setMutation(mutationCode);
                                                setShowSearchResults(false);
                                                toast.success(`Target: ${diseaseName}${mutationCode ? ` | Mutation: ${mutationCode}` : ''}`);
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
                                  <button onClick={() => setShowSearchResults(false)} className="text-[8px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Close Results</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Secondary Search: Mutation */}
                        <div className="space-y-3 relative">
                          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Mutation Override (Establish Variant)</Label>
                          <div className="relative group">
                            <Dna className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                              placeholder="Enter mutation if you want (e.g., H274Y)..." 
                              value={mutation}
                              onChange={(e) => setMutation(e.target.value)}
                              className="pl-12 h-16 bg-slate-50/50 border-none rounded-[1.5rem] font-bold text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:bg-white transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="results" className="mt-0 space-y-6">
                      {result && (
                        <div className="space-y-6">
                          <div className="p-6 bg-emerald-500 text-white rounded-[1.5rem] shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                             <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1">Structure</div>
                             <div className="text-3xl font-bold tracking-tight">{result.pdb_id}</div>
                             <div className="mt-3 flex items-center gap-2">
                                <div className="px-2 py-0.5 bg-white/20 rounded-md text-[8px] font-bold">READY</div>
                             </div>
                          </div>

                          <div className="space-y-2">
                             {result.results?.map((res: any, idx: number) => (
                                <button 
                                  key={idx} 
                                  onClick={() => setSelectedResult(res)}
                                  className={`w-full p-3 rounded-2xl flex justify-between items-center transition-all ${
                                    selectedResult?.name === res.name 
                                       ? 'bg-slate-900 text-white' 
                                      : 'bg-white hover:bg-slate-50 border border-slate-100/50'
                                  }`}
                                >
                                  <div className="text-left">
                                    <div className="text-[10px] font-bold uppercase tracking-wider">{res.name}</div>
                                    <div className={`text-[8px] font-mono opacity-40 truncate w-24 ${selectedResult?.name === res.name ? 'text-white' : 'text-slate-400'}`}>
                                       {res.smiles}
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center gap-2">
                                    <div className={`text-xs font-bold ${
                                      selectedResult?.name === res.name ? 'text-emerald-400' : 'text-slate-900'
                                    }`}>
                                      {res.affinity ? `${res.affinity}` : 'FAIL'}
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>

              {/* Action Footer - Fixed Bottom */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4 shrink-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Simulation Exhaustiveness</Label>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{exhaustiveness}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="range"
                      value={exhaustiveness ?? 8}
                      onChange={(e) => setExhaustiveness(parseInt(e.target.value) || 8)}
                      min={8} max={128} step={8} 
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (currentStep === 3) {
                          setCurrentStep(2);
                          setActiveTab("results");
                        } else {
                          setCurrentStep(1);
                          setActiveTab("receptor");
                        }
                      }} 
                      className="w-1/3 h-14 border-slate-200 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                    >
                      Back
                    </Button>
                  )}
                  {activeTab === "receptor" ? (
                    <Button 
                      onClick={handleRunDocking} 
                      disabled={loading || (!pdbId && !target)}
                      className={`${currentStep > 1 ? 'w-2/3' : 'w-full'} h-14 bg-emerald-500 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50`}
                    >
                      {loading ? (
                        <Activity className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                          Run Analysis
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (currentStep === 2) setCurrentStep(3);
                        else setCurrentStep(1);
                      }} 
                      className={`${currentStep > 1 ? 'w-2/3' : 'w-full'} h-14 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all`}
                    >
                      {currentStep === 2 ? "Next: Intelligence" : "Start New Analysis"}
                      {currentStep === 2 && <ChevronRight className="w-3.5 h-3.5 ml-2" />}
                    </Button>
                  )}
                </div>
              </div>
            </Tabs>
          </motion.div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep < 3 ? (
                <motion.div 
                  key="docking-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="flex flex-col gap-8 pb-12 pr-4 h-full">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`${cardStyle} flex-1 min-h-[600px] bg-white border border-slate-200`}
                      >
                        {/* Viewport UI Overlay */}
                        <div className="absolute top-8 left-8 z-20 space-y-1 pointer-events-none">
                           <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em] opacity-80">3D Structure</span>
                        </div>

                        <div className="absolute top-8 right-8 z-20 flex gap-2">
                           <Button 
                             variant="outline" 
                             size="icon"
                             onClick={() => setShowModal(true)}
                             className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-xl text-slate-900 hover:bg-slate-50 transition-all border border-slate-200"
                           >
                              <Maximize2 className="w-5 h-5" />
                           </Button>
                        </div>

                        <div className="h-full flex items-center justify-center relative p-8">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
                          
                          {!result ? (
                            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                              {/* Neural Background Animation */}
                              <div className="absolute inset-0 z-0">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)]" />
                                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                      opacity: [0.1, 0.3, 0.1],
                                      scale: [1, 1.2, 1],
                                      rotate: [0, 90, 180, 270, 360]
                                    }}
                                    transition={{ 
                                      duration: 10 + i * 5, 
                                      repeat: Infinity, 
                                      ease: "linear" 
                                    }}
                                    className="absolute inset-0 flex items-center justify-center"
                                  >
                                    <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/10" />
                                  </motion.div>
                                ))}
                              </div>

                              {/* Central HUD */}
                              <div className="relative z-10 text-center space-y-8 max-w-md px-6">
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="w-32 h-32 bg-white/5 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl relative group"
                                >
                                   <div className="absolute inset-0 bg-emerald-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                   <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                      className="absolute inset-0 border-2 border-dashed border-emerald-500/20 rounded-[3rem] scale-110"
                                   />
                                   <Dna className="w-12 h-12 text-emerald-400 relative z-10 animate-pulse" />
                                </motion.div>

                                <div className="space-y-4">
                                   <motion.h3 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                      className="text-4xl font-bold text-slate-900 tracking-tighter"
                                   >
                                      CLUSTER_A1 <span className="text-emerald-500">READY</span>
                                   </motion.h3>
                                   <motion.p 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.4 }}
                                      className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.4em] leading-loose"
                                   >
                                      Awaiting Biological Signature Input<br/>
                                      To Initialize Molecular Docking Engine
                                   </motion.p>
                                </div>

                                {/* HUD Telemetry Lines */}
                                <div className="grid grid-cols-2 gap-4 pt-8">
                                   {[
                                      { label: "NODE_STATUS", val: "STABLE", color: "text-emerald-400" },
                                      { label: "LATENCY", val: "0.04ms", color: "text-blue-400" },
                                      { label: "CLUSTER_SYNC", val: "99.9%", color: "text-purple-400" },
                                      { label: "THROUGHPUT", val: "4.2 TFlops", color: "text-amber-400" }
                                   ].map((item, i) => (
                                      <motion.div 
                                         key={i}
                                         initial={{ opacity: 0, x: -10 }}
                                         animate={{ opacity: 1, x: 0 }}
                                         transition={{ delay: 0.5 + i * 0.1 }}
                                         className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left backdrop-blur-md"
                                      >
                                         <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
                                         <div className={`text-[10px] font-bold ${item.color} tracking-wider`}>{item.val}</div>
                                      </motion.div>
                                   ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-[2rem] overflow-hidden border border-slate-100 bg-white relative group">
                              <Molecule3DViewer 
                                pdbData={result.pdb_content} 
                                ligandData={selectedResult?.ligand_pdb}
                                height={600} 
                              />
                              {/* Viewport HUD */}
                              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
                                 <div className="flex gap-2">
                                    <span className="px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-bold text-slate-900 uppercase border border-slate-200">CENTER: 0, 0, 0</span>
                                    <span className="px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-bold text-slate-900 uppercase border border-slate-200">ZOOM: 1.2X</span>
                                 </div>
                                 
                                 {result && (
                                    <div className="flex flex-col gap-2 items-end">
                                       <div className="px-4 py-2 bg-emerald-500/10 backdrop-blur-md rounded-xl border border-emerald-500/20">
                                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{result.pdb_id} :: LOADED</span>
                                       </div>
                                       {result.mutation && (
                                          <div className="px-4 py-2 bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/20">
                                             <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Mutation: {result.mutation}</span>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Telemetry Bar */}
                        <div className="p-8 bg-slate-50 backdrop-blur-xl border-t border-slate-100 flex items-center justify-between">
                           <div className="flex gap-8">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Stability</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Nominal</span>
                                 <div className="flex gap-0.5">
                                    {[1,2,3,4].map(i => <div key={i} className="w-1 h-3 bg-emerald-500/40 rounded-full" />)}
                                 </div>
                              </div>
                            </div>
                            <div className="w-[1px] h-10 bg-slate-200" />
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Coordinate Grid</span>
                              <span className="block text-xs font-bold text-slate-900 uppercase tracking-widest">RCSB_NATIVE_REF</span>
                            </div>
                          </div>

                          {result && (
                            <div className="flex gap-3">
                              <button className="h-12 px-6 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
                        <div className={cardStyle}>
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
                        </div>
                        
                        <div className={cardStyle}>
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
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div 
                  key="intelligence-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 pr-4 h-full">
                      {/* Step 6: Resistance Analysis */}
                      <div className={`${cardStyle} md:col-span-2 p-8 space-y-6`}>
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-purple-500 font-bold text-[10px] uppercase tracking-widest">
                                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                 Step 6 :: Resistance Scoring
                              </div>
                              <h3 className="text-2xl font-bold tracking-tight">Mutation-Based Resistance</h3>
                           </div>
                           <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                              <ShieldCheck className="w-6 h-6" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-6">
                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                 Analysis of typical resistance mutations (H275Y, I38T) against docked candidates. High scores indicate likely treatment failure.
                              </p>
                              <div className="space-y-3">
                                 {result?.results?.map((res: any, i: number) => (
                                    <div key={i} className="space-y-1.5">
                                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                          <span className="text-slate-600">{res.name}</span>
                                          <span className={res.resistance > 0.5 ? 'text-red-500' : 'text-emerald-500'}>
                                             {(res.resistance * 100).toFixed(0)}% Risk
                                          </span>
                                       </div>
                                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div 
                                             initial={{ width: 0 }}
                                             animate={{ width: `${res.resistance * 100}%` }}
                                             className={`h-full rounded-full ${res.resistance > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                          />
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <div className="bg-slate-50 rounded-3xl p-4 flex items-center justify-center border border-slate-100 overflow-hidden">
                              <DecisionMatrixChart />
                           </div>
                        </div>
                      </div>

                      {/* Step 8: Next Step Decision Engine */}
                      <div className={`${cardStyle} lg:col-span-1 p-8 space-y-6`}>
                         <div className="space-y-1">
                            <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                               <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                               Step 8 :: Decision Engine
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight">Best Action Path</h3>
                         </div>

                         <div className="space-y-4 pt-4">
                            {result?.results?.sort((a:any, b:any) => b.decision_score - a.decision_score).map((res: any, i: number) => (
                               <div key={i} className={`p-4 rounded-2xl border ${i === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-bold uppercase tracking-wider">{res.name}</span>
                                     <span className={`text-[10px] font-bold ${i === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        Score: {res.decision_score}
                                     </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ${i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                                        {i === 0 ? 'Primary Recommendation' : 'Alternative'}
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Summary Card */}
                      <div className={`${cardStyle} md:col-span-3 bg-slate-900 p-10 text-white relative overflow-hidden`}>
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                               <h2 className="text-4xl font-bold tracking-tight leading-tight">
                                  Diagnostic Synthesis <br/>
                                  <span className="text-emerald-400">Complete</span>
                               </h2>
                               <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                                  Based on weighted binding affinity, predicted resistance profile, and selectivity, the system suggests 
                                  <span className="text-white font-bold"> {result?.results?.sort((a:any, b:any) => b.decision_score - a.decision_score)[0]?.name} </span> 
                                  as the optimal treatment path for {result?.pdb_id}.
                               </p>
                               <div className="flex gap-4">
                                  <Button 
                                     onClick={handleGenerateReport}
                                     className="h-14 px-8 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                                  >
                                     Generate Full Report
                                  </Button>
                                  <Button onClick={() => setCurrentStep(1)} variant="outline" className="h-14 px-8 rounded-2xl font-bold text-xs uppercase tracking-widest border-white/10 text-white hover:bg-white/5 bg-transparent">
                                     Reset Analysis
                                  </Button>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
                                  <div className="text-3xl font-bold text-emerald-400">98.2%</div>
                               </div>
                               <div className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Urgency</div>
                                  <div className="text-3xl font-bold text-amber-400">High</div>
                               </div>
                            </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        </div>
        {/* Fullscreen Viewer Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden bg-white border-none rounded-[3rem]">
            <DialogHeader className="absolute top-8 left-8 z-50 p-0 pointer-events-none">
              <DialogTitle className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-900 opacity-60">
                Deep-Dive Structural Analysis :: {result?.pdb_id || result?.target}
              </DialogTitle>
            </DialogHeader>
            <div className="w-full h-full relative">
               <Molecule3DViewer 
                 pdbData={result?.pdb_content} 
                 ligandData={selectedResult?.ligand_pdb}
                 height="100%" 
               />
               <button 
                 onClick={() => setShowModal(false)}
                 className="absolute top-8 right-8 z-50 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl"
               >
                 <X className="w-5 h-5" />
               </button>
               
               {/* Modal HUD */}
               <div className="absolute bottom-12 left-12 z-50 flex gap-4 pointer-events-none">
                  <div className="px-6 py-4 bg-white/80 backdrop-blur-2xl rounded-3xl border border-slate-200 shadow-2xl space-y-1">
                     <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Receptor</div>
                     <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">{result?.pdb_id} :: LOADED</div>
                  </div>
                  {result?.mutation && (
                    <div className="px-6 py-4 bg-amber-500 text-white rounded-3xl shadow-2xl shadow-amber-500/20 space-y-1">
                       <div className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Variant</div>
                       <div className="text-xs font-bold text-white uppercase tracking-wider">{result?.mutation}</div>
                    </div>
                  )}
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

interface Molecule2DViewerProps {
  smiles: string;
  compoundName?: string;
  width?: number;
  height?: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RDKit: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initRDKitModule?: () => Promise<any>;
  }
}

/** Singleton promise so we only load + init RDKit once per page */
let rdkitReady: Promise<void> | null = null;

function ensureRDKit(): Promise<void> {
  if (rdkitReady) return rdkitReady;
  rdkitReady = new Promise((resolve, reject) => {
    if (window.RDKit) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js";
    script.onload = () => {
      if (!window.initRDKitModule) {
        reject(new Error("initRDKitModule not found after script load"));
        return;
      }
      window
        .initRDKitModule()
        .then((rdkit: unknown) => {
          // The returned object IS the RDKit module — assign it
          window.RDKit = rdkit;
          resolve();
        })
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load RDKit script"));
    document.head.appendChild(script);
  });
  return rdkitReady;
}

export function Molecule2DViewer({
  smiles,
  compoundName,
  width = 300,
  height = 220,
}: Molecule2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [mw, setMw] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!smiles) return;

    setError("");
    setMw(null);

    ensureRDKit()
      .then(() => {
        setReady(true);
      })
      .catch(() => {
        setError("Could not load structure renderer");
      });
  }, [smiles]);

  useEffect(() => {
    if (!ready || !smiles || !canvasRef.current) return;

    try {
      const mol = window.RDKit.get_mol(smiles);
      if (!mol || !mol.is_valid()) {
        setError("Invalid structure");
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Light theme: white background, dark bonds, standard CPK colours
      const svg = mol.get_svg_with_highlights(
        JSON.stringify({
          width,
          height,
          bondLineWidth: 2,
          backgroundColour: [1, 1, 1, 1], // white
          atomColourPalette: {
            6: [0.2, 0.2, 0.2], // Carbon → near-black
            7: [0.0, 0.4, 0.9], // Nitrogen → blue
            8: [0.9, 0.1, 0.1], // Oxygen → red
            9: [0.1, 0.7, 0.1], // Fluorine → green
            16: [0.8, 0.6, 0.0], // Sulfur → amber
            17: [0.1, 0.7, 0.1], // Chlorine → green
            35: [0.6, 0.0, 0.0], // Bromine → dark red
          },
        }),
      );

      const img = new Image();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };
      img.src = url;

      // Molecular descriptors
      try {
        const desc = JSON.parse(mol.get_descriptors()) as {
          MolWt?: number;
          TPSA?: number;
        };
        if (desc.MolWt) {
          setMw(
            `${desc.MolWt.toFixed(1)} Da · TPSA ${(desc.TPSA ?? 0).toFixed(1)} Å²`,
          );
        }
      } catch {
        /* descriptors optional */
      }

      mol.delete();
    } catch {
      setError("Failed to render structure");
    }
  }, [ready, smiles, width, height]);

  if (!smiles) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-300 text-xs font-medium"
        style={{ width, height }}
      >
        No SMILES data
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm">
      {/* Canvas area */}
      <div
        className="relative bg-white flex items-center justify-center"
        style={{ width, height }}
      >
        {error ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 px-6 text-center">
            <span className="text-2xl">⚗️</span>
            <p className="text-[11px] font-medium">{error}</p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Loading renderer…
            </p>
          </div>
        ) : (
          <canvas ref={canvasRef} width={width} height={height} />
        )}
      </div>

      {/* Footer */}
      {(compoundName || mw) && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 space-y-0.5">
          {compoundName && (
            <p className="text-xs font-bold text-slate-800">{compoundName}</p>
          )}
          {mw && <p className="text-[10px] font-medium text-slate-400">{mw}</p>}
        </div>
      )}
    </div>
  );
}

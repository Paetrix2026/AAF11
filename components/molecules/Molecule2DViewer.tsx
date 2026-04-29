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
    initRDKitModule?: () => Promise<unknown>;
  }
}

export function Molecule2DViewer({ smiles, compoundName, width = 300, height = 220 }: Molecule2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [mw, setMw] = useState<string | null>(null);

  useEffect(() => {
    if (!smiles) return;

    const render = () => {
      try {
        const mol = window.RDKit.get_mol(smiles);
        if (!mol || !mol.is_valid()) {
          setError("Invalid SMILES");
          return;
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw to canvas using RDKit SVG
        const svg = mol.get_svg_with_highlights(
          JSON.stringify({
            width,
            height,
            bondLineWidth: 1.5,
            backgroundColour: [0.067, 0.075, 0.098, 1],
            atomColourPalette: {
              6: [0.91, 0.918, 0.941],
              7: [0, 0.898, 0.765],
              8: [1, 0.267, 0.267],
              9: [0.565, 0.933, 0.565],
              16: [1, 0.498, 0],
              17: [0.565, 0.933, 0.565],
              35: [0.659, 0.188, 0.188],
            },
          })
        );

        // Render SVG to canvas
        const img = new Image();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;

        // Get molecular properties
        const descJSON = mol.get_descriptors();
        const desc = JSON.parse(descJSON) as { MolWt?: number; TPSA?: number };
        if (desc.MolWt) {
          setMw(`MW: ${desc.MolWt.toFixed(1)} · TPSA: ${(desc.TPSA ?? 0).toFixed(1)}`);
        }
        mol.delete();
      } catch {
        setError("Failed to render structure");
      }
    };

    if (window.RDKit) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js";
      script.onload = () => {
        if (window.initRDKitModule) {
          window.initRDKitModule().then(() => render()).catch(() => setError("Failed to load RDKit"));
        }
      };
      document.head.appendChild(script);
    }
  }, [smiles, width, height]);

  if (!smiles) {
    return (
      <div style={{
        width, height, background: "var(--bg-surface)", border: "1px solid var(--bg-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No SMILES data
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--bg-border)",
      boxShadow: "0 0 20px var(--accent-glow)", display: "inline-block",
    }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: "0.375rem", left: "0.5rem", fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.1em", background: "rgba(10,11,13,0.8)", padding: "0.2rem 0.4rem" }}>
          2D STRUCTURE
        </div>
        {error ? (
          <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>{error}</p>
          </div>
        ) : (
          <canvas ref={canvasRef} width={width} height={height} />
        )}
      </div>
      {(compoundName || mw) && (
        <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid var(--bg-border)" }}>
          {compoundName && (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "var(--text-primary)", marginBottom: "0.125rem" }}>
              {compoundName}
            </div>
          )}
          {mw && (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.5625rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {mw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

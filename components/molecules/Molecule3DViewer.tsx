"use client";

import { useEffect, useRef } from "react";

interface Molecule3DViewerProps {
  pdbData?: string;
  ligandData?: string;
  pdbUrl?: string;
  height?: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any;
  }
}

export function Molecule3DViewer({ pdbData, ligandData, pdbUrl, height = 320 }: Molecule3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glViewerRef = useRef<any>(null);

  useEffect(() => {
    if (!viewerRef.current) return;
    if (!pdbData && !pdbUrl && !ligandData) return;

    const load3Dmol = () => {
      if (!window.$3Dmol) return;
      if (glViewerRef.current) {
        glViewerRef.current.clear();
        glViewerRef.current.setBackgroundColor("#ffffff");
      } else {
        glViewerRef.current = window.$3Dmol.createViewer(viewerRef.current, {
          backgroundColor: "#ffffff",
        });
      }
      const viewer = glViewerRef.current;
      viewer.setBackgroundColor("#ffffff");
      
      if (pdbData) {
        viewer.addModel(pdbData, "pdb");
        viewer.setStyle({chain: "A"}, { cartoon: { colorscheme: "ssJmol", opacity: 0.8 } });
        // Style all atoms if no chain A
        viewer.setStyle({}, { cartoon: { colorscheme: "ssJmol", opacity: 0.8 } });
      }

      if (ligandData) {
        viewer.addModel(ligandData, "pdbqt");
        viewer.setStyle({model: -1}, { stick: { colorscheme: "element", radius: 0.2 } });
        viewer.zoomTo({model: -1});
      } else {
        viewer.zoomTo();
      }
      
      viewer.render();
    };

    if (window.$3Dmol) {
      load3Dmol();
    } else {
      const script = document.createElement("script");
      script.src = "https://3dmol.org/build/3Dmol-min.js";
      script.onload = load3Dmol;
      document.head.appendChild(script);
    }

    return () => {
      if (glViewerRef.current) {
        glViewerRef.current.clear();
      }
    };
  }, [pdbData, pdbUrl, ligandData]);

  if (!pdbData && !pdbUrl) {
    return (
      <div style={{
        height, background: "#ffffff", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No structure data available
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: "relative", height,
      background: "#ffffff",
      border: "1px solid var(--border)",
      boxShadow: "0 0 20px rgba(0,0,0,0.05)",
    }}>
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
      <div style={{
        position: "absolute", top: "0.5rem", left: "0.5rem",
        fontFamily: "var(--font-display)", fontSize: "0.5625rem",
        color: "var(--foreground)", letterSpacing: "0.1em",
        background: "rgba(255,255,255,0.8)", padding: "0.25rem 0.5rem",
        pointerEvents: "none",
      }}>
        3D STRUCTURE
      </div>
    </div>
  );
}

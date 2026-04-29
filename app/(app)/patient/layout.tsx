import { PatientSidebar } from "@/components/sidebar/PatientSidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <PatientSidebar />
      <main style={{ flex: 1, marginLeft: "240px", minHeight: "100vh", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

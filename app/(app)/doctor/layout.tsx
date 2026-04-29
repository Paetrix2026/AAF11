import { DoctorSidebar } from "@/components/sidebar/DoctorSidebar";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <DoctorSidebar />
      <main style={{ flex: 1, marginLeft: "260px", minHeight: "100vh", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

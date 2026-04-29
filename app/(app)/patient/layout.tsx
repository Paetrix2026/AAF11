import { PatientSidebar } from "@/components/sidebar/PatientSidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <PatientSidebar />
      <main className="flex-1 lg:ml-[280px] min-h-screen overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}

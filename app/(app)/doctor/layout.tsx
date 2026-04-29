import { DoctorSidebar } from "@/components/sidebar/DoctorSidebar";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DoctorSidebar />
      <main className="flex-1 lg:ml-[280px] min-h-screen overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}

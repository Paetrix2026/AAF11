import { PatientSidebar } from "@/components/sidebar/PatientSidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-6 flex items-stretch">
      <div className="w-full max-w-[1920px] mx-auto bg-white rounded-[3.5rem] border border-slate-200/60 flex overflow-hidden shadow-2xl shadow-slate-200/50">
        <PatientSidebar />
        <main className="flex-1 overflow-y-auto relative bg-[#fcfdfe]">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

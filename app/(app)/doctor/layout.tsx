import { DoctorSidebar } from "@/components/sidebar/DoctorSidebar";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 lg:p-6 flex items-stretch">
      <div className="w-full max-w-[1920px] mx-auto bg-white rounded-[3.5rem] border border-slate-200/60 flex overflow-hidden">
        <DoctorSidebar />
        <main className="flex-1 overflow-y-auto relative bg-[#fcfdfe]">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

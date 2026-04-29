"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Settings, 
  Search, 
  LogOut, 
  Activity,
  Plus,
  Users,
  Microscope,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { getPatients } from "@/lib/api";
import { getUserFromCookie, clearAuthCookie } from "@/lib/auth";
import type { Patient, User } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
  { icon: Activity, label: "Pipeline Engine", href: "/doctor/pipeline" },
  { icon: Microscope, label: "Molecular Docking", href: "/doctor/docking" },
  { icon: AlertTriangle, label: "Intelligence Alerts", href: "/doctor/alerts" },
  { icon: Settings, label: "System Config", href: "/doctor/settings" },
];

export function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setUser(getUserFromCookie());
    getPatients()
      .then((data) => setPatients(data))
      .catch(() => setPatients([]));
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  return (
    <aside className="w-[300px] bg-white border-r border-slate-100 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Healynx</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-6 space-y-1">
        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
          Core Systems
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all relative group ${
                isActive 
                  ? "text-slate-900 bg-slate-50" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-full" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-500" : "group-hover:text-slate-600"}`} />
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Registry Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-12 px-6">
        <div className="px-4 mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
            Registry
          </span>
          <button className="text-slate-300 hover:text-emerald-500 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-2 mb-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." 
              className="w-full bg-slate-50/50 border-none rounded-xl pl-9 h-10 text-xs font-medium placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500/5 transition-all"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 custom-scrollbar">
          <div className="space-y-1 pb-4">
            {filtered.map((p) => {
              const isActive = pathname === `/doctor/patients/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/doctor/patients/${p.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    p.status === 'critical' ? 'bg-red-500 animate-pulse' : 
                    p.status === 'active' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="overflow-hidden flex-1">
                    <div className={`text-[12px] font-medium truncate transition-colors ${isActive ? "text-emerald-700" : "text-slate-500 group-hover:text-slate-900"}`}>
                      {p.name}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Footer / User Profile */}
      <div className="p-6 mt-auto border-t border-slate-50">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 mb-4">
             <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold shrink-0 border border-slate-100">
               {user.name.split(' ').map(n => n[0]).join('')}
             </div>
             <div className="overflow-hidden">
               <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
               <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">Clinical Lead</div>
             </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start h-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold text-[13px] transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

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
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#f8fafc] flex flex-col z-[100] hidden lg:flex">
      {/* Brand Header */}
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Healynx</span>
        </div>

        {/* Doctor Identity */}
        {user && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white shadow-sm border border-slate-100/50 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center font-bold shrink-0 border border-slate-100 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-900 truncate uppercase tracking-wider">{user.name}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Clinical Lead</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="px-4 space-y-1 mt-2">
        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Core Systems
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all group ${
                isActive 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "group-hover:text-emerald-500"}`} />
                <span className="uppercase tracking-wider">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3 h-3 text-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Patient Directory */}
      <div className="flex-1 flex flex-col min-h-0 mt-8">
        <div className="px-8 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <Users className="w-3 h-3" /> Registry
          </span>
          <button className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:shadow-sm transition-all shadow-none">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        <div className="px-4 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search registry..." 
              className="w-full bg-white border-none shadow-sm rounded-xl pl-10 h-11 text-xs font-bold placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 custom-scrollbar">
          <div className="space-y-1 pb-4">
            {filtered.map((p) => {
              const isActive = pathname === `/doctor/patients/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/doctor/patients/${p.id}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? "bg-white shadow-md border border-slate-100" 
                      : "hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    p.status === 'critical' ? 'bg-red-500 animate-pulse' : 
                    p.status === 'active' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="overflow-hidden flex-1">
                    <div className={`text-[11px] font-bold truncate transition-colors ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"}`}>
                      {p.name}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Footer / System Control */}
      <div className="p-4 mt-auto">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs uppercase tracking-widest transition-all"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Terminate Session
        </Button>
      </div>
    </aside>
  );
}

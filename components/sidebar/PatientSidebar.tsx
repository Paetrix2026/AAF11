"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Pill, 
  Bell, 
  User, 
  LogOut, 
  ShieldCheck, 
  Send,
  Activity,
  ChevronRight,
  Settings,
  Shield
} from "lucide-react";
import { getUserFromCookie, clearAuthCookie } from "@/lib/auth";
import { connectTelegram } from "@/lib/api";
import type { User as UserType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/patient" },
  { icon: Activity, label: "Medication Protocol", href: "/patient/medications" },
  { icon: ShieldCheck, label: "Bio-Security Alerts", href: "/patient/alerts" },
  { icon: Settings, label: "Account Config", href: "/patient/profile" },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [telegramHandle, setTelegramHandle] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  const handleConnect = async () => {
    if (!telegramHandle.trim()) return;
    setConnecting(true);
    try {
      await connectTelegram(telegramHandle.trim());
    } catch {
      // Error handled silently for now
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = () => {
    clearAuthCookie();
    router.push("/login");
  };

  return (
    <aside className="w-[300px] bg-white border-r border-slate-100 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Healynx</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-6 space-y-1">
        <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
          Personal Health
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
              {isActive && <ChevronRight className="ml-auto w-3 h-3 text-slate-300" />}
            </Link>
          );
        })}
      </nav>

      {/* Intelligence Link Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-12 px-6">
        <div className="px-4 mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-50">
            Intelligence Link
          </span>
          <Send className="w-3.5 h-3.5 text-slate-300" />
        </div>
        
        <div className="px-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
          
          {user?.telegramHandle ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-600">@{user.telegramHandle}</span>
            </div>
          ) : (
            <div className="space-y-3">
               <Input 
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                  placeholder="@handle" 
                  className="bg-white border-slate-200 rounded-xl h-9 text-xs font-medium placeholder:text-slate-300 focus-visible:ring-emerald-500/10"
               />
               <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full h-9 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-800"
               >
                  {connecting ? "Linking..." : "Establish Link"}
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Footer / User Profile */}
      <div className="p-6 mt-auto border-t border-slate-50">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 mb-4 border border-slate-100">
             <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold shrink-0 border border-slate-200">
               {user.name.split(' ').map(n => n[0]).join('')}
             </div>
             <div className="overflow-hidden">
               <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
               <div className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">Verified Profile</div>
             </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start h-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold text-[13px] transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          End Session
        </Button>
      </div>
    </aside>
  );
}

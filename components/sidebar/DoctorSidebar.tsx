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
  Microscope
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
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-background border-r flex flex-col z-[100] hidden lg:flex shadow-sm">
      {/* Brand Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Healynx</span>
        </div>

        {/* Doctor Identity */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">Clinical Lead</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="p-4 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Primary Systems
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Patient Directory */}
      <div className="flex-1 flex flex-col min-h-0 border-t">
        <div className="px-6 py-4 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Patients</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patients..." 
              className="w-full bg-muted border-transparent pl-9 h-9 text-sm focus-visible:ring-1"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            {filtered.map((p) => {
              const isActive = pathname === `/doctor/patients/${p.id}`;
              return (
                <Link
                  key={p.id}
                  href={`/doctor/patients/${p.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors group ${
                    isActive 
                      ? "bg-muted border border-border" 
                      : "border border-transparent hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    p.status === 'critical' ? 'bg-destructive' : 
                    p.status === 'active' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="overflow-hidden flex-1">
                    <div className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
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
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

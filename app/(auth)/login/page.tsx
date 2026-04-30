"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  User,
  Lock,
  Mail,
  ChevronRight,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setAuthCookie, setUserCookie } from "@/lib/auth";
import Link from "next/link";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"doctor" | "patient">("doctor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    try {
      const result = await login(data.email, data.password, activeTab);
      setAuthCookie(result.token);
      setUserCookie(result.user);
      router.push(result.user.role === "doctor" ? "/doctor" : "/patient");
    } catch (err: any) {
      setError(err.message || "Authorization failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white selection:bg-[#00e5c3]/30">
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-[1fr_550px] gap-12 lg:gap-20 items-center">
          {/* Left Side - Bold Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:flex flex-col justify-center"
          >
            <h1 className="text-7xl xl:text-8xl font-black text-black leading-none tracking-tight pr-8 uppercase">
              Clinical
              <br />
              Intelligence
            </h1>
            <p className="mt-8 text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em]">
              Authorized Personnel Only • Identity Verification Protocol 1.2.4
            </p>
            <div className="mt-12 p-6 border-l-4 border-[#00e5c3] bg-gray-50 max-w-md space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Demo Credentials
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#00e5c3] w-16">
                    Doctor
                  </span>
                  <span className="text-[11px] font-bold text-gray-900">
                    doctor@healynx.ai / demo1234
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-16">
                    Patient
                  </span>
                  <span className="text-[11px] font-bold text-gray-900">
                    arjun@healynx.ai / demo1234
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 w-16">
                    Patient
                  </span>
                  <span className="text-[11px] font-bold text-gray-900">
                    priya@healynx.ai / demo1234
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Glassmorphism Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white backdrop-blur-3xl border border-gray-200 rounded-2xl p-8 lg:p-10 shadow-2xl shadow-black/10">
              {/* Mobile Title */}
              <div className="lg:hidden mb-8">
                <h1 className="text-4xl font-black text-black leading-none uppercase">
                  Clinical
                  <br />
                  Intelligence
                </h1>
              </div>

              <div className="mb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Sign in to access your portal
                  </p>
                </div>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <Activity className="w-5 h-5 text-[#00e5c3]" />
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setActiveTab("doctor")}
                  type="button"
                  className={`flex-1 p-4 rounded-md transition-all duration-300 border-2 ${
                    activeTab === "doctor"
                      ? "bg-[#00e5c3] border-[#00e5c3] shadow-lg shadow-[#00e5c3]/20"
                      : "bg-gray-50/50 hover:bg-gray-100/50 border-gray-100"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Stethoscope
                      className={`w-5 h-5 ${activeTab === "doctor" ? "text-black" : "text-gray-400"}`}
                    />
                    <p
                      className={`font-black text-[10px] uppercase tracking-widest ${activeTab === "doctor" ? "text-black" : "text-gray-500"}`}
                    >
                      Clinical Lead
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("patient")}
                  type="button"
                  className={`flex-1 p-4 rounded-md transition-all duration-300 border-2 ${
                    activeTab === "patient"
                      ? "bg-[#00e5c3] border-[#00e5c3] shadow-lg shadow-[#00e5c3]/20"
                      : "bg-gray-50/50 hover:bg-gray-100/50 border-gray-100"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <User
                      className={`w-5 h-5 ${activeTab === "patient" ? "text-black" : "text-gray-400"}`}
                    />
                    <p
                      className={`font-black text-[10px] uppercase tracking-widest ${activeTab === "patient" ? "text-black" : "text-gray-500"}`}
                    >
                      Patient Portal
                    </p>
                  </div>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-widest overflow-hidden"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="email"
                    className="text-gray-500 font-black text-[9px] uppercase tracking-[0.2em] group-focus-within:text-[#00e5c3] transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-3 h-3" /> Identity Signature
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="doctor@healynx.ai"
                    placeholder="doctor@healynx.ai"
                    {...register("email", {
                      required: "Identity signature required",
                    })}
                    className="h-14 px-4 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#00e5c3] focus:ring-[#00e5c3] rounded-md border-2 transition-all font-medium"
                  />
                  {errors.email && (
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <Label
                    htmlFor="password"
                    className="text-gray-500 font-black text-[9px] uppercase tracking-[0.2em] group-focus-within:text-[#00e5c3] transition-colors flex items-center gap-2"
                  >
                    <Lock className="w-3 h-3" /> Authorization Key
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    defaultValue="demo1234"
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Authorization key required",
                    })}
                    className="h-14 px-4 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#00e5c3] focus:ring-[#00e5c3] rounded-md border-2 transition-all font-medium"
                  />
                  {errors.password && (
                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#00e5c3] focus:ring-[#00e5c3]"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-900 transition-colors">
                      Remember Session
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-[10px] font-black text-[#00e5c3] uppercase tracking-wider hover:underline"
                  >
                    Reset Key?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#00e5c3] text-black font-black uppercase text-xs tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00e5c3]/20 rounded-md disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 animate-spin" />{" "}
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Establish Session <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <a href="#" className="hover:text-black transition-colors">
                      Privacy
                    </a>
                    <a href="#" className="hover:text-black transition-colors">
                      Terms
                    </a>
                  </div>
                  <Link href="/" className="text-[#00e5c3] hover:underline">
                    Return to Terminal
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

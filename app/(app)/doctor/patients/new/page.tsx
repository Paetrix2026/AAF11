"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPatient } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, UserPlus, Loader2 } from "lucide-react";
import type { PatientInput } from "@/types";

type MedEntry = { name: string; dose: string; since: string };

const emptyMed = (): MedEntry => ({ name: "", dose: "", since: "" });

export default function NewPatientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState("Male");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"active" | "stable" | "critical">("active");
  const [conditionsRaw, setConditionsRaw] = useState("");
  const [meds, setMeds] = useState<MedEntry[]>([emptyMed()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cardStyle =
    "bg-white/50 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] overflow-hidden";
  const labelStyle =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 block";
  const inputStyle =
    "w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-emerald-500/50 transition-all";
  const selectStyle =
    "w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500/50 transition-all appearance-none";

  function updateMed(idx: number, field: keyof MedEntry, val: string) {
    setMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m)));
  }

  function addMed() {
    setMeds((prev) => [...prev, emptyMed()]);
  }

  function removeMed(idx: number) {
    setMeds((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Patient name is required.");
      return;
    }
    setSubmitting(true);
    setError("");

    const payload: PatientInput = {
      name: name.trim(),
      age: age ? parseInt(age) : undefined,
      gender,
      location: location.trim() || undefined,
      status,
      conditions: conditionsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      medications: meds.filter((m) => m.name.trim()),
      doctorId: "",
    };

    try {
      await createPatient(payload);
      router.push("/doctor/patients");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create patient. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-[900px] mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em]">
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Clinical Subject</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Add Patient</h1>
          <p className="text-slate-500 text-[11px] font-medium uppercase tracking-widest">
            Register a new patient into the clinical database.
          </p>
        </div>
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200/60 rounded-2xl p-5 text-red-600 text-[11px] font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity */}
        <div className={`${cardStyle} p-10`}>
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Step 1</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Patient Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className={labelStyle} htmlFor="name">Full Name <span className="text-red-400">*</span></label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className={inputStyle}
              />
            </div>

            {/* Age */}
            <div>
              <label className={labelStyle} htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min={0}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 45"
                className={inputStyle}
              />
            </div>

            {/* Gender */}
            <div>
              <label className={labelStyle} htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={selectStyle}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className={labelStyle} htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cairo, Egypt"
                className={inputStyle}
              />
            </div>

            {/* Status */}
            <div>
              <label className={labelStyle} htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "stable" | "critical")}
                className={selectStyle}
              >
                <option value="active">Active</option>
                <option value="stable">Stable</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clinical Info */}
        <div className={`${cardStyle} p-10`}>
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Step 2</p>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Clinical Profile</h3>
          </div>

          <div>
            <label className={labelStyle} htmlFor="conditions">Comorbidities / Conditions</label>
            <textarea
              id="conditions"
              value={conditionsRaw}
              onChange={(e) => setConditionsRaw(e.target.value)}
              placeholder="e.g. Type 2 Diabetes, Hypertension"
              rows={3}
              className={`${inputStyle} resize-none`}
            />
            <p className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Separate multiple conditions with commas
            </p>
          </div>
        </div>

        {/* Medications */}
        <div className={`${cardStyle} p-10`}>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Step 3</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Current Medications</h3>
            </div>
            <button
              type="button"
              onClick={addMed}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          </div>

          <div className="space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_140px_140px_40px] gap-3 px-1">
              <span className={labelStyle}>Drug Name</span>
              <span className={labelStyle}>Dose</span>
              <span className={labelStyle}>Since (date)</span>
              <span />
            </div>

            {meds.map((med, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_140px_140px_40px] gap-3 items-center">
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => updateMed(idx, "name", e.target.value)}
                  placeholder="e.g. Metformin"
                  className={inputStyle}
                />
                <input
                  type="text"
                  value={med.dose}
                  onChange={(e) => updateMed(idx, "dose", e.target.value)}
                  placeholder="e.g. 500 mg"
                  className={inputStyle}
                />
                <input
                  type="date"
                  value={med.since}
                  onChange={(e) => updateMed(idx, "since", e.target.value)}
                  className={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeMed(idx)}
                  disabled={meds.length === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-300 hover:text-red-400 hover:border-red-100 hover:bg-red-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4 pt-2 pb-6">
          <Link
            href="/doctor/patients"
            className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Register Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

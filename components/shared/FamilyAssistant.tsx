"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  text: string;
  time: string;
}

interface FamilyAssistantProps {
  patientName?: string;
  primaryDrug?: string;
  riskLevel?: string;
  predictedOutcome?: string;
  patientSummary?: string;
  compact?: boolean;
}

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const QUICK_QUESTIONS = [
  "Is the treatment working?",
  "What should we watch for?",
  "When to see a doctor?",
];

export function FamilyAssistant({
  patientName,
  primaryDrug,
  riskLevel,
  predictedOutcome,
  patientSummary,
  compact = false,
}: FamilyAssistantProps) {
  const initialMessage: Message = {
    role: "assistant",
    text: `Hi! I'm your family health assistant. I can explain ${patientName || "your patient"}'s treatment in simple terms. Ask me anything — I'm here to help.`,
    time: now(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendQuestion(question: string) {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: "user", text: question.trim(), time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/telegram/family/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          context: { patientName, primaryDrug, riskLevel, predictedOutcome, patientSummary },
        }),
      });
      const json = await res.json();
      const answer =
        json?.data?.answer || json?.message || "I'm unable to fetch an answer right now. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", text: answer, time: now() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Connection error. Please check your network and try again.", time: now() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Outcome color
  const outcomeColor =
    predictedOutcome === "stable"
      ? "text-emerald-600"
      : predictedOutcome === "decline"
        ? "text-amber-600"
        : predictedOutcome === "fail"
          ? "text-red-600"
          : "text-slate-500";

  // Risk color
  const riskColor =
    riskLevel === "low"
      ? "text-emerald-600"
      : riskLevel === "moderate"
        ? "text-amber-600"
        : riskLevel === "high" || riskLevel === "critical"
          ? "text-red-600"
          : "text-slate-500";

  return (
    <div className="bg-white border border-slate-200/50 rounded-[2rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white leading-tight">Family Assistant</h3>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Powered by @discovery67bot
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <a
            href="https://t.me/discovery67bot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Open Channel
          </a>
        </div>
      </div>

      {/* Status tiles */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
        {[
          {
            label: "Treatment",
            value: primaryDrug || "Pending analysis",
            colorClass: "text-slate-900",
          },
          {
            label: "Outcome",
            value: predictedOutcome || "—",
            colorClass: outcomeColor,
          },
          {
            label: "Risk",
            value: riskLevel || "—",
            colorClass: riskColor,
          },
        ].map(({ label, value, colorClass }) => (
          <div key={label} className="bg-white px-5 py-3">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              {label}
            </p>
            <p className={`text-[11px] font-black capitalize truncate ${colorClass}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div
        className={`bg-slate-50/50 overflow-y-auto px-5 py-4 space-y-3 ${
          compact ? "max-h-40" : "max-h-64"
        }`}
      >
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="flex justify-end gap-2">
              <div className="max-w-[75%] space-y-1">
                <div className="bg-slate-900 text-white rounded-2xl rounded-br-sm px-4 py-2 text-[11px] font-medium leading-relaxed">
                  {msg.text}
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest text-right">
                  {msg.time}
                </p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="w-3 h-3 text-emerald-600" />
              </div>
              <div className="max-w-[80%] space-y-1">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm text-[11px] text-slate-700 font-medium leading-relaxed">
                  {msg.text}
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                  {msg.time}
                </p>
              </div>
            </div>
          )
        )}

        {/* Loading dots */}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick questions */}
      <div className="px-5 pt-3 pb-1 flex flex-wrap gap-2 border-t border-slate-100 bg-white">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendQuestion(q)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="px-5 py-4 bg-white border-t border-slate-100 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendQuestion(input)}
          disabled={loading}
          placeholder="Ask about treatment, risks, or next steps..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => sendQuestion(input)}
          disabled={loading || !input.trim()}
          className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm shadow-emerald-200"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

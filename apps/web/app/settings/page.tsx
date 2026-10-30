"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Settings,
  Moon,
  Sun,
  Laptop,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Info,
  Server,
  Zap,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import type { HealthResponse } from "@accesslens/shared";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [defaultStandard, setDefaultStandard] = useState("wcag22aa");

  useEffect(() => {
    setMounted(true);
    void checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      setHealthLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Settings className="h-3.5 w-3.5" />
          Workspace Configuration
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          System Settings & Model Status
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure interface appearance, verify Nebius Token Factory connection, and review privacy controls.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Section 1: Appearance */}
        <section aria-labelledby="appearance-heading" className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 id="appearance-heading" className="text-lg font-bold text-foreground">
            Appearance & Theme
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose how AccessLens AI looks on your device. Designed with 4.5:1 accessible color contrast.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Laptop },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition ${
                  mounted && theme === id
                    ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200 shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: AI Remediation Engine & Nebius Connection */}
        <section aria-labelledby="ai-model-heading" className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Zap className="h-3 w-3" />
                Nebius Token Factory
              </div>
              <h2 id="ai-model-heading" className="mt-2 text-lg font-bold text-foreground">
                NVIDIA Nemotron AI Service
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Integration status for open-source NVIDIA models hosted via Nebius AI Cloud.
              </p>
            </div>

            <button
              type="button"
              onClick={checkBackend}
              disabled={healthLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${healthLoading ? "animate-spin" : ""}`} />
              Test Connection
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <span className="text-xs text-muted-foreground">Provider:</span>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {health?.aiProvider || "Nebius Token Factory / Nebius AI Cloud"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <span className="text-xs text-muted-foreground">Active Model Identifier:</span>
              <p className="mt-1 font-mono text-sm font-semibold text-foreground">
                {health?.aiModel || "nvidia/llama-3.1-nemotron-70b-instruct"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <span className="text-xs text-muted-foreground">AI Service Connection:</span>
              <div className="mt-1 flex items-center gap-2">
                {healthLoading ? (
                  <span className="text-xs text-muted-foreground">Checking health...</span>
                ) : health?.aiConfigured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Online & Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Offline Fallback Active (Deterministic rules ready)
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <span className="text-xs text-muted-foreground">Backend API Engine:</span>
              <div className="mt-1 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-foreground">
                  Fastify 5.2 + axe-core 4.10 + Playwright
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 text-xs text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/60 dark:text-indigo-200">
            <strong>Security Guarantee:</strong> API keys and private cloud credentials are kept strictly in backend environment variables (<code>NEBIUS_API_KEY</code>) and are never transmitted to client browsers.
          </div>
        </section>

        {/* Section 3: Default Audit Standards */}
        <section aria-labelledby="standards-heading" className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 id="standards-heading" className="text-lg font-bold text-foreground">
            Default Audit Standards
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure the baseline rulesets executed for new accessibility audits.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/30">
              <input
                type="radio"
                name="standard"
                value="wcag22aa"
                checked={defaultStandard === "wcag22aa"}
                onChange={() => setDefaultStandard("wcag22aa")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-foreground">WCAG 2.2 Level AA (Latest standard)</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Includes focus appearance, dragging movements, target size minimum, and consistent help criteria alongside WCAG 2.1 rules.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-border p-4 cursor-pointer hover:bg-muted/30">
              <input
                type="radio"
                name="standard"
                value="wcag21aa"
                checked={defaultStandard === "wcag21aa"}
                onChange={() => setDefaultStandard("wcag21aa")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-semibold text-foreground">WCAG 2.1 Level AA</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standard enterprise baseline covering mobile accessibility, orientation, contrast, and reflow.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Section 4: Privacy & Authentication Notice */}
        <section aria-labelledby="privacy-heading" className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 id="privacy-heading" className="text-lg font-bold text-foreground">
              Privacy & Access Model
            </h2>
          </div>
          <div className="mt-3 text-xs leading-relaxed text-muted-foreground space-y-3">
            <p>
              <strong>Individual & Team MVP Mode:</strong> In alignment with hackathon security standards, this installation operates in open workspace mode without fake user authentication. Audits are stored locally in the secure application database.
            </p>
            <p>
              <strong>Data Retention Notice:</strong> Pasted HTML and scanned public websites are stored solely for generating reports and verifying patches. Uploaded files are sandboxed and never executed with server privileges.
            </p>
          </div>
        </section>

        {/* App Version Info */}
        <div className="text-center text-xs text-muted-foreground">
          <span>AccessLens AI v1.0.0 · Nebius × NVIDIA Global AI Hackathon Submission</span>
        </div>
      </div>
    </main>
  );
}

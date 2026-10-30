"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  UploadCloud,
  FileCode,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Info,
  Layers,
  Settings,
} from "lucide-react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";

const urlSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Please enter a valid URL beginning with http:// or https://")
    .refine((val) => {
      try {
        const u = new URL(val);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only HTTP and HTTPS protocols are allowed.")
    .refine((val) => {
      try {
        const u = new URL(val);
        const host = u.hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local") || host.endsWith(".internal")) {
          return false;
        }
        if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/.test(host)) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }, "Private, loopback, and local network addresses are prohibited for SSRF security."),
});

export default function NewAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();

  const [mode, setMode] = useState<"url" | "upload" | "paste">("url");
  const [projectName, setProjectName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [wcagLevel, setWcagLevel] = useState<"wcag21aa" | "wcag22aa">("wcag22aa");

  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If query ?demo=true is present, auto-load demo
  useEffect(() => {
    if (searchParams.get("demo") === "true") {
      void handleLoadDemo();
    }
  }, [searchParams]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setInputError("Only .html or .htm files are supported.");
      return;
    }

    if (file.size > 500 * 1024) {
      setInputError("File exceeds the 500 KB limit. Please choose a smaller HTML document.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlInput(content);
      setUploadedFileName(file.name);
      setInputError(null);
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = async () => {
    try {
      setIsSubmitting(true);
      setProgressMessage("Fetching broken demo page...");
      setInputError(null);
      let demoContent = "";
      try {
        demoContent = await api.getDemoHtml("broken-site.html");
      } catch {
        demoContent = `<!DOCTYPE html><html lang="en"><head><title>Demo Aura Brew</title></head><body><h1>Aura Brew</h1><h4>Fresh Beans</h4><div onclick="alert('click')">Buy Now</div><img src="coffee.jpg"><input placeholder="Your email"><select id="opt"><option>Dark Roast</option></select><button tabindex="5">VIP Club</button></body></html>`;
      }
      setHtmlInput(demoContent);
      setUploadedFileName("broken-site.html (Sample Demo)");
      setMode("upload");
      setProgressMessage("Initializing audit on demo content...");
      const res = await api.createScan({ html: demoContent });
      toastSuccess("Sample demo audit launched!");
      router.push(`/audit/${res.scan.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load demo";
      setInputError(msg);
      toastError(msg);
      setIsSubmitting(false);
      setProgressMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    if (mode === "url") {
      const validation = urlSchema.safeParse({ url: urlInput });
      if (!validation.success) {
        setInputError(validation.error.errors[0]?.message || "Invalid URL.");
        return;
      }

      try {
        setIsSubmitting(true);
        setProgressMessage("Connecting to URL scanner...");
        const res = await api.createScan({ url: validation.data.url });
        toastSuccess("URL audit started!");
        router.push(`/audit/${res.scan.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start audit.";
        setInputError(msg);
        toastError(msg);
        setIsSubmitting(false);
        setProgressMessage("");
      }
    } else {
      // HTML upload or paste
      const trimmedHtml = htmlInput.trim();
      if (!trimmedHtml || trimmedHtml.length < 15) {
        setInputError("Please provide valid HTML content (at least 15 characters).");
        return;
      }
      if (new Blob([trimmedHtml]).size > 500 * 1024) {
        setInputError("HTML content exceeds 500 KB limit.");
        return;
      }

      try {
        setIsSubmitting(true);
        setProgressMessage("Parsing HTML document and preparing sandbox...");
        const res = await api.createScan({ html: trimmedHtml });
        toastSuccess("HTML audit started!");
        router.push(`/audit/${res.scan.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start audit.";
        setInputError(msg);
        toastError(msg);
        setIsSubmitting(false);
        setProgressMessage("");
      }
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Deterministic WCAG 2.2 Testing
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Start New Accessibility Audit
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Scan any public web URL or upload static HTML to discover accessibility barriers, generate verified AI remediations, and export compliance reports.
        </p>
      </div>

      {/* Main card */}
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-8 dark:shadow-slate-900/40">
        {/* Input Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 gap-4">
          <div role="tablist" aria-label="Input mode" className="inline-flex rounded-xl bg-muted p-1">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "url"}
              onClick={() => {
                setMode("url");
                setInputError(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                mode === "url"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              Public URL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "upload"}
              onClick={() => {
                setMode("upload");
                setInputError(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                mode === "upload"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              File Upload
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "paste"}
              onClick={() => {
                setMode("paste");
                setInputError(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                mode === "paste"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              Paste HTML
            </button>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Load Sample Demo Page
          </button>
        </div>

        {/* Audit Configuration form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Optional Project Name */}
          <div>
            <label htmlFor="project-name" className="block text-xs font-semibold text-foreground">
              Audit / Project Name <span className="font-normal text-muted-foreground">(Optional)</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Marketing Landing Page Q4"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Mode 1: URL Input */}
          {mode === "url" && (
            <div>
              <label htmlFor="audit-url-input" className="block text-xs font-semibold text-foreground">
                Website Public URL
              </label>
              <div className="relative mt-1.5">
                <input
                  id="audit-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (inputError) setInputError(null);
                  }}
                  placeholder="https://example.com"
                  aria-invalid={Boolean(inputError)}
                  aria-describedby={inputError ? "url-error" : "url-security-notice"}
                  className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/50 transition focus-visible:ring-2 ${
                    inputError
                      ? "border-destructive focus-visible:ring-destructive/50"
                      : "border-input focus-visible:ring-ring"
                  }`}
                />
              </div>

              <div id="url-security-notice" className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>
                  <strong>SSRF Safe:</strong> Only public HTTP/HTTPS URLs are audited. Localhost, RFC1918 private ranges, and cloud metadata endpoints are strictly blocked.
                </span>
              </div>
            </div>
          )}

          {/* Mode 2: HTML File Upload */}
          {mode === "upload" && (
            <div>
              <label className="block text-xs font-semibold text-foreground">Upload HTML File</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition hover:border-indigo-400 hover:bg-muted/40 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <UploadCloud className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {uploadedFileName ? uploadedFileName : "Click to select HTML file or drag & drop"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Supported format: .html, .htm (Max 500 KB)</p>
                {htmlInput && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Ready ({Math.round(new Blob([htmlInput]).size / 1024)} KB)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: Paste HTML */}
          {mode === "paste" && (
            <div>
              <label htmlFor="audit-html-paste" className="block text-xs font-semibold text-foreground">
                Paste Raw HTML Markup
              </label>
              <textarea
                id="audit-html-paste"
                rows={8}
                value={htmlInput}
                onChange={(e) => {
                  setHtmlInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder={`<!DOCTYPE html>\n<html lang="en">\n  <head><title>Test Page</title></head>\n  <body>\n    <!-- Paste your markup here -->\n  </body>\n</html>`}
                className="mt-1.5 w-full rounded-xl border border-input bg-background p-3.5 font-mono text-xs leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Scripts are sandboxed and never executed with server privileges.
              </p>
            </div>
          )}

          {/* Conformance Standard */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-foreground">Audit Ruleset Target</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="wcag-level"
                  value="wcag22aa"
                  checked={wcagLevel === "wcag22aa"}
                  onChange={() => setWcagLevel("wcag22aa")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-foreground">WCAG 2.2 Level AA (Recommended)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="wcag-level"
                  value="wcag21aa"
                  checked={wcagLevel === "wcag21aa"}
                  onChange={() => setWcagLevel("wcag21aa")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-foreground">WCAG 2.1 Level AA</span>
              </label>
            </div>
          </div>

          {/* Validation Error Message */}
          {inputError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{inputError}</span>
            </div>
          )}

          {/* Action Button & Live Progress */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{progressMessage || "Auditing with axe-core & Playwright..."}</span>
                </>
              ) : (
                <>
                  <span>Run Accessibility Audit</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

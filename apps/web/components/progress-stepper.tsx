"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export type ProgressStage = "queued" | "rendering" | "detecting" | "normalizing" | "done" | "error";

interface ProgressStepperProps {
  scanId: string;
  initialStage?: ProgressStage;
  onComplete?: () => void;
}

const STAGES: { key: ProgressStage; label: string; desc: string }[] = [
  { key: "queued", label: "Queued", desc: "Waiting for worker slot" },
  { key: "rendering", label: "Rendering", desc: "Headless Chromium" },
  { key: "detecting", label: "Detecting", desc: "axe-core + keyboard nav" },
  { key: "normalizing", label: "Normalizing", desc: "Scoring & deduplication" },
  { key: "done", label: "Complete", desc: "Audit ready" },
];

export function ProgressStepper({
  scanId,
  initialStage = "queued",
  onComplete,
}: ProgressStepperProps) {
  const [currentStage, setCurrentStage] = useState<ProgressStage>(initialStage);
  const [stageMessage, setStageMessage] = useState<string>("Initializing…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (currentStage === "done") {
      onComplete?.();
      return;
    }

    const streamUrl = api.getStreamUrl(scanId);
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(streamUrl);

      const handleEvent = (stage: ProgressStage) => (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as { message?: string };
          setCurrentStage(stage);
          if (data.message) setStageMessage(data.message);
          if (stage === "done") {
            onComplete?.();
            eventSource?.close();
          }
          if (stage === "error") {
            setIsError(true);
            eventSource?.close();
          }
        } catch {
          // ignore parse errors
        }
      };

      STAGES.forEach(({ key }) => {
        eventSource?.addEventListener(key, handleEvent(key) as EventListener);
      });
      eventSource?.addEventListener("error_event", handleEvent("error") as EventListener);

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // fallback
    }

    return () => {
      eventSource?.close();
    };
  }, [scanId, currentStage, onComplete]);

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const isDone = currentStage === "done";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Scan step: {currentStage}. {stageMessage}
      </div>

      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Audit pipeline
          </p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{stageMessage}</p>
        </div>
        {!isDone && !isError && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Running
          </div>
        )}
        {isDone && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Complete
          </div>
        )}
      </div>

      {/* Steps */}
      <ol
        className="relative flex gap-0"
        aria-label="Scan pipeline steps"
      >
        {STAGES.map((step, idx) => {
          const stepDone = currentIndex > idx || isDone;
          const stepActive = currentIndex === idx && !isDone;
          const stepPending = !stepDone && !stepActive;

          return (
            <li
              key={step.key}
              className="relative flex flex-1 flex-col items-center"
              aria-current={stepActive ? "step" : undefined}
            >
              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div className="absolute left-1/2 top-3.5 h-0.5 w-full" aria-hidden="true">
                  <div
                    className={`h-full transition-colors duration-500 ${
                      stepDone ? "bg-emerald-500" : "bg-border"
                    }`}
                  />
                </div>
              )}

              {/* Step icon */}
              <div
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isError && stepActive
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                    : stepDone
                    ? "border-emerald-500 bg-emerald-500"
                    : stepActive
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-border bg-background"
                }`}
              >
                {isError && stepActive ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                ) : stepDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                ) : stepActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" aria-hidden="true" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground/40" aria-hidden="true" />
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-[11px] font-semibold transition-colors ${
                    stepDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : stepActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </p>
                <p className="hidden text-[10px] text-muted-foreground/40 sm:block">
                  {step.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

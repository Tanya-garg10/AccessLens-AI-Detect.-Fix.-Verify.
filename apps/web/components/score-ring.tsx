"use client";

import React from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  criticalCount?: number;
  seriousCount?: number;
  moderateCount?: number;
  minorCount?: number;
  showBadges?: boolean;
}

const SEVERITY_BADGES = [
  { key: "critical", color: "#ef4444", bgClass: "bg-red-500", label: "Critical" },
  { key: "serious", color: "#f97316", bgClass: "bg-orange-500", label: "Serious" },
  { key: "moderate", color: "#f59e0b", bgClass: "bg-amber-500", label: "Moderate" },
  { key: "minor", color: "#94a3b8", bgClass: "bg-slate-400", label: "Minor" },
] as const;

export function ScoreRing({
  score,
  size = 176,
  strokeWidth = 13,
  criticalCount = 0,
  seriousCount = 0,
  moderateCount = 0,
  minorCount = 0,
  showBadges = true,
}: ScoreRingProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColorConfig = (s: number) => {
    if (s >= 80)
      return {
        stroke: "#10b981",
        textClass: "text-emerald-600 dark:text-emerald-400",
        label: "Good",
        labelClass: "text-emerald-600/70 dark:text-emerald-400/70",
      };
    if (s >= 50)
      return {
        stroke: "#f59e0b",
        textClass: "text-amber-600 dark:text-amber-400",
        label: "Needs work",
        labelClass: "text-amber-600/70 dark:text-amber-400/70",
      };
    return {
      stroke: "#ef4444",
      textClass: "text-red-600 dark:text-red-400",
      label: "Critical",
      labelClass: "text-red-600/70 dark:text-red-400/70",
    };
  };

  const config = getColorConfig(normalizedScore);
  const counts = [criticalCount, seriousCount, moderateCount, minorCount];

  return (
    <div className="flex flex-col items-center">
      <div
        role="meter"
        aria-valuenow={normalizedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Accessibility compliance score: ${normalizedScore} out of 100`}
        className="relative flex items-center justify-center"
      >
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          aria-hidden="true"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted/60"
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
          />
        </svg>

        <div className="absolute flex flex-col items-center gap-0.5 text-center">
          <span className={`text-[42px] font-black leading-none tracking-tight ${config.textClass}`}>
            {normalizedScore}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            / 100
          </span>
          <span className={`mt-0.5 text-[11px] font-semibold ${config.labelClass}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Severity badges */}
      {showBadges && (
        <div
          className="mt-5 flex flex-wrap justify-center gap-1.5"
          aria-label="Issue counts by severity"
        >
          {SEVERITY_BADGES.map(({ key, bgClass, label }, i) => (
            <div
              key={key}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            >
              <span className={`h-2 w-2 rounded-full ${bgClass}`} aria-hidden="true" />
              <span>
                {label}: <strong className="text-foreground">{counts[i]}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

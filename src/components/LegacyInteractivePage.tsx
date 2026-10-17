"use client";

import { useEffect, useRef } from "react";
import { clearLegacyLabel, runLegacyScript } from "@/lib/run-legacy-script";

type Props = {
  html: string;
  script: string;
  label: string;
};

/**
 * Mounts ZIP-faithful HTML + imperative scripts for complex wizards
 * (song intake, account, requests).
 */
export function LegacyInteractivePage({ html, script, label }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = html;
    const id = requestAnimationFrame(() => {
      runLegacyScript(script, label);
    });
    return () => {
      cancelAnimationFrame(id);
      clearLegacyLabel(label);
      root.innerHTML = "";
    };
  }, [html, script, label]);

  return <div ref={rootRef} suppressHydrationWarning />;
}

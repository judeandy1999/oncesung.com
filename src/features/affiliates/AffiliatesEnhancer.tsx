"use client";

import { useEffect } from "react";

const KEY = "oncesung-affiliate-draft-v1";

export function AffiliatesEnhancer() {
  useEffect(() => {
    const orders = document.getElementById("affiliate-orders") as HTMLInputElement | null;
    const pkg = document.getElementById("affiliate-package") as HTMLSelectElement | null;
    if (!orders || !pkg) return;

    const money = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

    const update = () => {
      const n = Number(orders.value);
      const price = Number(pkg.value);
      const label = document.getElementById("affiliate-orders-label");
      const earnings = document.getElementById("affiliate-earnings");
      const equation = document.getElementById("affiliate-equation");
      if (label) label.textContent = n + " " + (n === 1 ? "order" : "orders");
      if (earnings) earnings.textContent = money(n * price * 0.25);
      if (equation) equation.textContent = n + " orders × " + money(price) + " × 25%";
    };

    orders.addEventListener("input", update);
    pkg.addEventListener("change", update);
    update();

    const form = document.getElementById("affiliate-application-form") as HTMLFormElement | null;
    const status = document.getElementById("affiliate-form-status");
    if (!form || !status) return;

    const fields = () => Object.fromEntries(new FormData(form).entries());

    try {
      const draft = JSON.parse(localStorage.getItem(KEY) || "null") as Record<string, string> | null;
      if (draft) {
        for (const [name, value] of Object.entries(draft)) {
          const el = form.elements.namedItem(name) as HTMLInputElement | null;
          if (el && el.type !== "checkbox") el.value = value;
        }
        status.textContent = "Your saved draft has been restored. It has not been submitted.";
      }
    } catch {
      /* ignore */
    }

    const onSubmit = (e: Event) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      try {
        localStorage.setItem(KEY, JSON.stringify(fields()));
        status.textContent =
          "Draft saved on this device. It has not been submitted to Oncesung.";
      } catch {
        status.textContent =
          "Your browser could not save the draft. Use Download draft instead.";
      }
    };
    form.addEventListener("submit", onSubmit);

    const download = document.getElementById("affiliate-download");
    const onDownload = () => {
      if (!form.reportValidity()) return;
      const data = fields();
      const text =
        "Oncesung partner application draft\nNot submitted\n\n" +
        Object.entries(data)
          .filter(([k]) => k !== "acknowledgement")
          .map(([k, v]) => k.toUpperCase() + ": " + v)
          .join("\n\n");
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "oncesung-partner-application.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = "Draft downloaded. It has not been submitted.";
    };
    download?.addEventListener("click", onDownload);

    const clearBtn = document.getElementById("affiliate-clear");
    const onClear = () => {
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      form.reset();
      status.textContent = "Application draft cleared from this device.";
    };
    clearBtn?.addEventListener("click", onClear);

    return () => {
      orders.removeEventListener("input", update);
      pkg.removeEventListener("change", update);
      form.removeEventListener("submit", onSubmit);
      download?.removeEventListener("click", onDownload);
      clearBtn?.removeEventListener("click", onClear);
    };
  }, []);

  return null;
}

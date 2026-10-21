"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PACKAGES, oncesungStore, resolvePackage, type PackageKey } from "@/lib/store";
import { hrefFromHtml } from "@/lib/routes";

const PLAY =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>';
const PAUSE =
  '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';

function $(sel: string, root: ParentNode = document) {
  return root.querySelector(sel) as HTMLElement | null;
}
function $$(sel: string, root: ParentNode = document) {
  return [...root.querySelectorAll(sel)] as HTMLElement[];
}

export function SiteInteractions() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const on = (
      el: Element | Document | null,
      type: string,
      fn: EventListener,
      opts?: AddEventListenerOptions,
    ) => {
      if (!el) return;
      el.addEventListener(type, fn, opts);
      cleanups.push(() => el.removeEventListener(type, fn, opts));
    };

    /* Rewrite legacy .html links that slipped through */
    $$("a[href$='.html'], a[href*='.html#']").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      a.setAttribute("href", hrefFromHtml(href));
    });

    /* data-toast */
    on(document, "click", (e) => {
      const t = (e.target as Element).closest("[data-toast]") as HTMLElement | null;
      if (!t) return;
      e.preventDefault();
      toast(t.dataset.toast || "");
    });

    /* Waveforms + playback. Cards and players with data-audio play the MP3.
       Buttons with no file keep the old preview toast. */
    const fmt = (s: number) =>
      Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
    const audio = new Audio();
    audio.preload = "metadata";
    let activeSrc = "";

    const srcOf = (btn: HTMLElement) => {
      if (btn.dataset.audio) return btn.dataset.audio;
      const host = btn.closest("[data-audio]") as HTMLElement | null;
      return host?.dataset.audio || "";
    };

    const paint = (player: HTMLElement, pos: number, total: number) => {
      const wave = $(".wave", player);
      const time = $(".time", player);
      if (!wave) return;
      const bars = $$("i", wave);
      const safe = total > 0 ? total : 1;
      const k = Math.round((Math.min(Math.max(pos, 0), safe) / safe) * bars.length);
      bars.forEach((b, i) => b.classList.toggle("on", i < k));
      if (time) time.textContent = fmt(pos) + " / " + fmt(total);
    };

    const displayTotal = (src: string) => {
      const player = $$(".player").find((p) => p.dataset.audio === src);
      const attr = player ? +(player.dataset.len || 0) : 0;
      if (attr > 0) return attr;
      if (activeSrc === src && Number.isFinite(audio.duration) && audio.duration > 0) {
        return Math.round(audio.duration);
      }
      return 0;
    };

    const drawSrc = (src: string, pos: number) => {
      const total = displayTotal(src);
      $$(".player").forEach((p) => {
        if (p.dataset.audio === src) paint(p, pos, total);
      });
    };

    const resetOtherPlayers = (src: string) => {
      $$(".player").forEach((p) => {
        if (!p.dataset.audio || p.dataset.audio === src) return;
        paint(p, 0, +(p.dataset.len || 0));
      });
    };

    const mark = (src: string, playing: boolean) => {
      $$(".play").forEach((b) => {
        const bsrc = srcOf(b);
        if (!bsrc) return;
        const on = playing && bsrc === src;
        b.classList.toggle("playing", on);
        b.innerHTML = on ? PAUSE : PLAY;
      });
    };

    $$(".wave").forEach((w, wi) => {
      if (w.querySelector("i")) return;
      const n = +(w.dataset.bars || 64);
      let seed = (wi + 3) * 9301;
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i");
        const env = Math.sin((i / n) * Math.PI) * 0.6 + 0.4;
        b.style.height = Math.max(12, Math.round((rnd() * 0.7 + 0.3) * env * 100)) + "%";
        w.appendChild(b);
      }
    });

    $$(".player").forEach((p) => paint(p, 0, +(p.dataset.len || 0)));

    const onTime = () => {
      if (activeSrc) drawSrc(activeSrc, audio.currentTime);
    };
    const onEnded = () => {
      const src = activeSrc;
      mark(src, false);
      if (src) drawSrc(src, displayTotal(src));
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    cleanups.push(() => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    });

    on(
      document,
      "click",
      (e) => {
      const btn = (e.target as Element).closest(".play") as HTMLElement | null;
      if (!btn) return;
      const src = srcOf(btn);
      if (!src) {
        if (btn.closest(".player")) return;
        e.preventDefault();
        e.stopPropagation();
        const onPlaying = btn.classList.toggle("playing");
        btn.innerHTML = onPlaying ? PAUSE : PLAY;
        if (onPlaying) toast("Playing preview…");
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (activeSrc === src && !audio.paused) {
        audio.pause();
        mark(src, false);
        return;
      }
      if (activeSrc !== src) {
        resetOtherPlayers(src);
        audio.src = src;
        activeSrc = src;
      }
      if (audio.ended) audio.currentTime = 0;
      mark(src, true);
      void audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        mark(src, false);
        toast("Couldn't play this preview");
      });
    },
      { capture: true },
    );

    $$(".player").forEach((p) => {
      const wave = $(".wave", p);
      const src = p.dataset.audio || "";
      if (!wave) return;
      if (!src) {
        const total = +(p.dataset.len || 192);
        let pos = 0;
        on(wave, "click", (e) => {
          const r = wave.getBoundingClientRect();
          pos = Math.round((((e as MouseEvent).clientX - r.left) / r.width) * total);
          paint(p, pos, total);
        });
        return;
      }
      on(wave, "click", (e) => {
        const r = wave.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, ((e as MouseEvent).clientX - r.left) / r.width));
        const apply = () => {
          const dur =
            Number.isFinite(audio.duration) && audio.duration > 0
              ? audio.duration
              : +(p.dataset.len || 0);
          try {
            audio.currentTime = ratio * dur;
          } catch {
            return;
          }
          drawSrc(src, audio.currentTime);
        };
        if (activeSrc !== src) {
          resetOtherPlayers(src);
          audio.src = src;
          activeSrc = src;
          mark(src, false);
        }
        if (audio.readyState >= 1) apply();
        else audio.addEventListener("loadedmetadata", apply, { once: true });
      });
    });

    /* Favourites */
    on(document, "click", (e) => {
      const f = (e.target as Element).closest(".fav, .heart-btn") as HTMLElement | null;
      if (!f) return;
      e.preventDefault();
      e.stopPropagation();
      f.classList.toggle("on");
      toast(f.classList.contains("on") ? "Saved to favourites" : "Removed from favourites");
    });

    /* Selectable groups */
    $$("[data-select]").forEach((g) => {
      const multi = g.dataset.select === "multi";
      on(g, "click", (e) => {
        const it = (e.target as Element).closest(
          ".chip,.tile,.mood,.slot,.pay-opt,.pkg",
        ) as HTMLElement | null;
        if (!it || !g.contains(it)) return;
        if (multi) it.classList.toggle("on");
        else {
          $$(".chip,.tile,.mood,.slot,.pay-opt,.pkg", g).forEach((x) => x.classList.remove("on"));
          it.classList.add("on");
        }
        g.dispatchEvent(new CustomEvent("change", { detail: it }));
      });
    });

    /* Gallery filter */
    const filt = $("[data-filter]");
    if (filt) {
      on(filt, "change", (e) => {
        const cat = (e as CustomEvent<HTMLElement>).detail?.dataset?.cat;
        if (!cat) return;
        $$("[data-cats]").forEach((c) =>
          c.classList.toggle("hide", cat !== "all" && !(c.dataset.cats || "").includes(cat)),
        );
      });
    }

    /* Accordion */
    $$(".acc-item button").forEach((b) =>
      on(b, "click", () => b.parentElement?.classList.toggle("open")),
    );

    /* Carousels */
    $$(".carousel").forEach((c) => {
      const t = $(".track-x", c);
      if (!t) return;
      $$(".car-btn", c).forEach((b) =>
        on(b, "click", () => {
          t.scrollBy({
            left: (b.classList.contains("next") ? 1 : -1) * t.clientWidth * 0.8,
            behavior: "smooth",
          });
        }),
      );
    });

    /* Counters */
    $$("[data-count]").forEach((el) => {
      const input = el as HTMLInputElement | HTMLTextAreaElement;
      const c = el.parentElement?.querySelector(".counter");
      const max = +input.dataset.count!;
      input.maxLength = max;
      const upd = () => {
        if (c) c.textContent = input.value.length + "/" + max;
      };
      on(input, "input", upd);
      upd();
    });

    /* Tag inputs */
    $$(".tagbox").forEach((box) => {
      const inp = $("input", box) as HTMLInputElement | null;
      on(box, "click", (e) => {
        const btn = e.target as HTMLElement;
        if (btn.matches(".tag button")) btn.parentElement?.remove();
      });
      if (inp) {
        on(inp, "keydown", (e) => {
          const ke = e as KeyboardEvent;
          if (ke.key === "Enter" && inp.value.trim()) {
            ke.preventDefault();
            const t = document.createElement("span");
            t.className = "tag";
            t.innerHTML =
              inp.value.trim().replace(/</g, "&lt;") +
              ' <button type="button" aria-label="Remove">×</button>';
            box.insertBefore(t, inp);
            inp.value = "";
          }
        });
      }
    });

    /* Reference links */
    $$("[data-add-link]").forEach((btn) =>
      on(btn, "click", () => {
        const id = btn.dataset.addLink!;
        const inp = document.getElementById(id) as HTMLInputElement | null;
        if (!inp || !inp.value.trim()) return toast("Paste a link or describe a song first");
        const list = document.getElementById(id + "-list");
        const li = document.createElement("div");
        li.className = "pill";
        li.textContent = inp.value.trim();
        list?.appendChild(li);
        inp.value = "";
      }),
    );

    /* Calendar */
    $$("[data-calendar]").forEach((cal) => {
      if (cal.querySelector(".dow")) return;
      const [y, m] = (cal.dataset.calendar || "").split("-").map(Number);
      const first = new Date(y, m - 1, 1);
      const days = new Date(y, m, 0).getDate();
      const start = (first.getDay() + 6) % 7;
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((d) =>
        cal.insertAdjacentHTML("beforeend", `<div class="dow">${d}</div>`),
      );
      for (let i = 0; i < start; i++) cal.insertAdjacentHTML("beforeend", "<span></span>");
      const sel = +(cal.dataset.selected || 0);
      for (let d = 1; d <= days; d++) {
        const dow = (start + d - 1) % 7;
        const dis = dow === 6 || d < +(cal.dataset.min || 1);
        cal.insertAdjacentHTML(
          "beforeend",
          `<button type="button" ${dis ? "disabled" : ""} class="${d === sel ? "on" : ""}">${d}</button>`,
        );
      }
      on(cal, "click", (e) => {
        const b = (e.target as Element).closest("button") as HTMLButtonElement | null;
        if (!b || b.disabled) return;
        $$("button", cal).forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
      });
    });

    /* Copy */
    $$("[data-copy]").forEach((b) =>
      on(b, "click", () => {
        const txt = b.dataset.copy || "";
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
          () => toast("Link copied to clipboard"),
          () => toast("Link: " + txt),
        );
      }),
    );

    /* Package selection */
    $$("[data-package]").forEach((a) =>
      on(a, "click", () => oncesungStore.set("package", a.dataset.package)),
    );

    const pkgGroup = $("[data-pkg-group]");
    const renderSummary = () => {
      const key = resolvePackage(oncesungStore.get<string>("package"));
      const p = PACKAGES[key];
      const total = p.price;
      $$("[data-pkg-name]").forEach((e) => {
        e.textContent = p.name + " Package";
      });
      $$("[data-pkg-price]").forEach((e) => {
        e.textContent = "$" + p.price.toFixed(2);
      });
      $$("[data-pkg-delivery]").forEach((e) => {
        e.textContent = p.delivery;
      });
      $$("[data-pkg-features]").forEach((u) => {
        u.innerHTML = p.features.map((x) => "<li>" + x + "</li>").join("");
      });
      $$("[data-pkg-badge]").forEach((b) => b.classList.toggle("hide", key !== "signature"));
      $$("[data-subtotal]").forEach((e) => {
        e.textContent = "$" + total.toFixed(2);
      });
      $$("[data-total]").forEach((e) => {
        e.textContent = "$" + total.toFixed(2);
      });
    };

    if (pkgGroup) {
      const cur = resolvePackage(oncesungStore.get<string>("package"));
      $$(".pkg", pkgGroup).forEach((p) => {
        const onPkg = p.dataset.pkg === cur;
        p.classList.toggle("on", onPkg);
        const b = $(".pkg-btn", p);
        if (b) b.textContent = onPkg ? "Selected" : "Select";
      });
      on(pkgGroup, "change", (e) => {
        const detail = (e as CustomEvent<HTMLElement>).detail;
        const pkg = detail?.dataset?.pkg as PackageKey | undefined;
        if (pkg) oncesungStore.set("package", pkg);
        renderSummary();
        $$(".pkg", pkgGroup).forEach((p) => {
          const b = $(".pkg-btn", p);
          if (b) b.textContent = p.classList.contains("on") ? "Selected" : "Select";
        });
      });
    }
    renderSummary();

    /* Wizard save */
    $$("[data-save]").forEach((a) =>
      on(a, "click", () => {
        const data = oncesungStore.get<Record<string, string>>("story") || {};
        $$("[data-key]").forEach((f) => {
          if (f.matches("[data-select]")) {
            data[f.dataset.key!] = $$(".on", f)
              .map((x) => x.dataset.v || x.textContent?.trim() || "")
              .join(", ");
          } else {
            data[f.dataset.key!] = (f as HTMLInputElement).value;
          }
        });
        oncesungStore.set("story", data);
      }),
    );

    const story = oncesungStore.get<Record<string, string>>("story");
    if (story) {
      $$("[data-show]").forEach((e) => {
        const v = story[e.dataset.show!];
        e.textContent = v || "—";
      });
    }

    /* Payment methods */
    const pm = $("[data-paymethods]");
    if (pm) {
      on(pm, "change", (e) => {
        const detail = (e as CustomEvent<HTMLElement>).detail;
        const m = detail?.dataset?.method;
        $("#card-form")?.classList.toggle("hide", m !== "card");
        $("#wallet-note")?.classList.toggle("hide", m === "card");
        const n = $("#wallet-name");
        if (n && detail) n.textContent = detail.textContent?.trim() || "";
      });
    }

    const cn = $("#cc-number") as HTMLInputElement | null;
    if (cn) {
      on(cn, "input", () => {
        cn.value = cn.value
          .replace(/\D/g, "")
          .slice(0, 16)
          .replace(/(.{4})/g, "$1 ")
          .trim();
      });
    }
    const ex = $("#cc-exp") as HTMLInputElement | null;
    if (ex) {
      on(ex, "input", () => {
        let v = ex.value.replace(/\D/g, "").slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + " / " + v.slice(2);
        ex.value = v;
      });
    }

    /* Gift finder quiz */
    const quiz = $("[data-quiz]");
    if (quiz) {
      let step = 0;
      const panes = $$(".quiz-pane", quiz);
      const dots = $$(".step", quiz);
      const lines = $$(".step-line", quiz);
      const show = () => {
        panes.forEach((p, i) => p.classList.toggle("hide", i !== step));
        dots.forEach((d, i) => {
          d.classList.toggle("cur", i === step);
          d.classList.toggle("done", i < step);
        });
        lines.forEach((l, i) => l.classList.toggle("done", i < step));
        $("[data-quiz-back]", quiz)?.classList.toggle(
          "hide",
          step === 0 || step === panes.length - 1,
        );
        $("[data-quiz-next]", quiz)?.classList.toggle("hide", step === panes.length - 1);
      };
      on($("[data-quiz-next]", quiz), "click", () => {
        if (!$(".on", panes[step])) return toast("Pick an option to continue");
        step = Math.min(step + 1, panes.length - 1);
        if (step === panes.length - 1) {
          const pick = $$(".quiz-pane .on", quiz).map((x) => x.textContent?.trim() || "");
          const occ = $("#quiz-result-occ");
          const who = $("#quiz-result-who");
          const style = $("#quiz-result-style");
          if (occ) occ.textContent = pick[0] || "your occasion";
          if (who) who.textContent = (pick[1] || "someone special").toLowerCase();
          if (style) style.textContent = (pick[2] || "Acoustic").toLowerCase();
        }
        show();
      });
      on($("[data-quiz-back]", quiz), "click", () => {
        step = Math.max(0, step - 1);
        show();
      });
      show();
    }

    /* Dashboard tabs */
    const dt = $("[data-order-tabs]");
    if (dt) {
      on(dt, "change", (e) => {
        const f = (e as CustomEvent<HTMLElement>).detail?.dataset?.f;
        if (!f) return;
        $$("[data-status]").forEach((o) =>
          o.classList.toggle("hide", f !== "all" && o.dataset.status !== f),
        );
      });
    }

    /* Demo forms — no real payment/email/auth */
    $$("form[data-demo]").forEach((f) =>
      on(f, "submit", (e) => {
        e.preventDefault();
        const form = f as HTMLFormElement;
        const next = form.dataset.next;
        if (next) {
          const path = hrefFromHtml(next);
          if (path.includes("order-confirmed")) {
            toast("Demo only — no payment was processed.");
          }
          router.push(path);
        } else {
          toast(form.dataset.demo || "Thanks! We'll be in touch.");
        }
      }),
    );

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [toast, router, pathname]);

  return null;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, User } from "lucide-react";
import { Logo } from "./Logo";
import { MOBILE_EXTRA_LINKS, NAV_LINKS } from "@/lib/routes";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container nav">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? "active" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="icon-btn" href="/examples" aria-label="Search">
            <Search size={19} strokeWidth={1.8} />
          </Link>
          <Link className="icon-btn" href="/account" aria-label="Account">
            <User size={19} strokeWidth={1.8} />
          </Link>
          <Link className="btn btn-primary btn-sm" href="/song-intake">
            Create a Song
          </Link>
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu size={19} strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div className={`mobile-menu${open ? " open" : ""}`}>
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        {MOBILE_EXTRA_LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          href="/song-intake"
          onClick={() => setOpen(false)}
        >
          Create a Song
        </Link>
      </div>
    </header>
  );
}

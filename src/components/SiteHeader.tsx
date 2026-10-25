"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, User } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { Logo } from "./Logo";
import { MOBILE_EXTRA_LINKS, NAV_LINKS } from "@/lib/routes";

const ACCOUNT_HREFS = new Set(["/account", "/dashboard", "/requests"]);

export function SiteHeader({ email, isAdmin = false }: { email: string | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(email);
  const extraLinks = MOBILE_EXTRA_LINKS.filter((link) => !ACCOUNT_HREFS.has(link.href));
  const accountLinks = signedIn
    ? [
        { href: "/account", label: "My Account" },
        { href: "/dashboard", label: "My Orders" },
        ...(isAdmin ? [{ href: "/admin/orders", label: "Song orders" }] : []),
        { href: "/requests", label: "Revisions & Remakes" },
      ]
    : [
        { href: "/login", label: "Log in" },
        { href: "/register", label: "Register" },
      ];

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
          <Link className="icon-btn" href={signedIn ? "/account" : "/login"} aria-label={signedIn ? "Account" : "Log in"}>
            <User size={19} strokeWidth={1.8} />
          </Link>
          {signedIn ? (
            <form action={signOut}>
              <button className="btn btn-ghost btn-sm" type="submit">
                Log out
              </button>
            </form>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" href="/login">
                Log in
              </Link>
              <Link className="btn btn-outline btn-sm" href="/register">
                Register
              </Link>
            </>
          )}
          {isAdmin ? (
            <Link className="btn btn-ghost btn-sm" href="/admin/orders">
              Orders
            </Link>
          ) : null}
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
        {accountLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        {extraLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        {signedIn ? (
          <form action={signOut}>
            <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} type="submit">
              Log out
            </button>
          </form>
        ) : null}
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

"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { signOut } from "@/features/auth/actions";
import { Logo } from "./Logo";
import { useToast } from "@/hooks/use-toast";

export function SiteFooter({ email }: { email: string | null }) {
  const { toast } = useToast();

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast("You're on the list — watch your inbox!");
    e.currentTarget.reset();
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-grid">
          <div>
            <Logo />
            <p className="muted" style={{ marginTop: 12, maxWidth: 280 }}>
              Personalized songs for every occasion. Real emotion. Real memories. A truly unique gift.
            </p>
            <form className="row" style={{ maxWidth: 320 }} onSubmit={onNewsletter}>
              <input
                className="input"
                type="email"
                placeholder="Your email"
                required
                style={{ flex: 1, width: "auto" }}
              />
              <button className="btn btn-primary btn-sm" type="submit">
                Join
              </button>
            </form>
          </div>
          <div>
            <h5>Create</h5>
            <ul>
              <li>
                <Link href="/song-intake">Create a Song</Link>
              </li>
              <li>
                <Link href="/gift-finder">Gift Finder Quiz</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/gift-cards">Gift Cards</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li>
                <Link href="/examples">Song Examples</Link>
              </li>
              <li>
                <Link href="/songs">Genres &amp; Moods</Link>
              </li>
              <li>
                <Link href="/occasions">Occasions</Link>
              </li>
              <li>
                <Link href="/reviews">Our Promise</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Account</h5>
            <ul>
              {email ? (
                <>
                  <li>
                    <Link href="/account">My Account</Link>
                  </li>
                  <li>
                    <Link href="/dashboard">My Orders</Link>
                  </li>
                  <li>
                    <Link href="/requests">Revisions &amp; Remakes</Link>
                  </li>
                  <li>
                    <Link href="/downloads">Downloads</Link>
                  </li>
                  <li>
                    <form action={signOut}>
                      <button className="link" type="submit" style={{ background: "none", border: 0, padding: 0 }}>
                        Log out
                      </button>
                    </form>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login">Log in</Link>
                  </li>
                  <li>
                    <Link href="/register">Register</Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/referral">Refer a Friend</Link>
              </li>
              <li>
                <Link href="/affiliates">Affiliate Partners</Link>
              </li>
            </ul>
          </div>
          <div>
            <h5>Help</h5>
            <ul>
              <li>
                <Link href="/how-it-works">How It Works</Link>
              </li>
              <li>
                <Link href="/faq">FAQ &amp; Guarantees</Link>
              </li>
              <li>
                <Link href="/guarantee">Money-back Guarantee</Link>
              </li>
              <li>
                <Link href="/faq#contact">Contact Support</Link>
              </li>
              <li>
                <Link href="/sitemap">All pages</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Oncesung. All rights reserved.</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
import {
  Gift,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { signOut } from "@/features/auth/actions";

export type AccountSidebarActive =
  | "dashboard"
  | "requests"
  | "account"
  | "admin"
  | "gift-sent";

const NAV: { key: AccountSidebarActive | "create" | "favourites" | "gift-cards" | "referral" | "support"; href: string; label: string; Icon: typeof Package }[] = [
  { key: "dashboard", href: "/dashboard", label: "My Orders", Icon: Package },
  { key: "requests", href: "/requests", label: "Revisions & Remakes", Icon: MessageCircle },
  { key: "create", href: "/song-intake", label: "Create a New Song", Icon: Plus },
  { key: "favourites", href: "/examples", label: "My Favourites", Icon: Heart },
  { key: "gift-sent", href: "/gift-cards/sent", label: "Gifts I sent", Icon: Gift },
  { key: "gift-cards", href: "/gift-cards", label: "Buy a gift card", Icon: Gift },
  { key: "referral", href: "/referral", label: "Refer a Friend", Icon: Users },
  { key: "account", href: "/account", label: "My Account", Icon: Settings },
  { key: "support", href: "/faq", label: "Support", Icon: HelpCircle },
];

export function AccountSidebar({
  name,
  email,
  initial,
  active,
  showAdmin = false,
}: {
  name: string;
  email: string;
  initial: string;
  active: AccountSidebarActive | null;
  showAdmin?: boolean;
}) {
  return (
    <aside>
      <div className="row" style={{ flexWrap: "nowrap", marginBottom: 16 }}>
        <span className="avatar" style={{ width: 44, height: 44 }}>
          {initial}
        </span>
        <div>
          <b>{name}</b>
          <div className="xs muted">{email}</div>
        </div>
      </div>
      <nav className="side-nav">
        {NAV.map(({ key, href, label, Icon }) => (
          <Link key={href} className={active === key ? "on" : undefined} href={href}>
            <Icon size={17} strokeWidth={1.8} aria-hidden />
            {label}
          </Link>
        ))}
        {showAdmin ? (
          <Link className={active === "admin" ? "on" : undefined} href="/admin/orders">
            <Settings size={17} strokeWidth={1.8} aria-hidden />
            Song orders (admin)
          </Link>
        ) : null}
        <form action={signOut}>
          <button type="submit" className="side-nav-logout">
            <LogOut size={17} strokeWidth={1.8} aria-hidden />
            Logout
          </button>
        </form>
      </nav>
      <div className="soft pad center" style={{ marginTop: 20 }}>
        <div style={{ color: "var(--coral)", width: 34, height: 34, margin: "0 auto" }}>
          <Gift size={34} strokeWidth={1.8} aria-hidden />
        </div>
        <h3 style={{ fontSize: 20, marginTop: 8 }}>Make someone&apos;s day with a song</h3>
        <Link className="btn btn-primary btn-sm" href="/song-intake">
          Create a New Song
        </Link>
      </div>
    </aside>
  );
}

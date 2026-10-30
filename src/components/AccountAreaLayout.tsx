import { AccountSidebar, type AccountSidebarActive } from "@/components/AccountSidebar";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/require-user";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";

type Props = {
  children: React.ReactNode;
  active: AccountSidebarActive | null;
  loginNext: string;
};

/** One sidebar + main column for signed-in account pages. */
export async function AccountAreaLayout({ children, active, loginNext }: Props) {
  const user = await requireUser(loginNext);
  const profile = await getOwnProfile();
  const name = profile?.fullName || user.email || "Your account";
  const email = profile?.email || user.email || "";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const showAdmin = isAdminConfigured() && isAdminEmail(user.email);

  return (
    <main>
      <section style={{ padding: "28px 0 48px" }}>
        <div className="container orders-layout" id="dash">
          <AccountSidebar
            name={name}
            email={email}
            initial={initial}
            active={active}
            showAdmin={showAdmin}
          />
          <div className="account-main">{children}</div>
        </div>
      </section>
    </main>
  );
}

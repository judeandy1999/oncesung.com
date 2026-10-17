import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        d="M16 27C9 22 3 17.5 3 11.2 3 7.2 6 4 9.8 4c2.6 0 4.7 1.4 6.2 3.6C17.5 5.4 19.6 4 22.2 4 26 4 29 7.2 29 11.2 29 17.5 23 22 16 27z"
        fill="#f25f55"
      />
      <path
        d="M13.5 19.5V10.5l7-1.5v8.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.8" cy="19.6" r="1.9" fill="#fff" />
      <circle cx="18.8" cy="17.6" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link className="logo" href={href}>
      <LogoMark />
      Oncesung
    </Link>
  );
}

import Link from "next/link";

type Props = {
  title: string;
  lead: string;
  eyebrow?: string;
};

export function ComingSoonPage({ title, lead, eyebrow = "Coming soon" }: Props) {
  return (
    <main>
      <section style={{ padding: "56px 0 72px", background: "linear-gradient(180deg,#fff8f5,#fff1ec)" }}>
        <div className="container center" style={{ maxWidth: 560 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h1 style={{ marginTop: 12 }}>{title}</h1>
          <p className="lead muted" style={{ marginTop: 12 }}>
            {lead}
          </p>
          <p className="small muted" style={{ marginTop: 16 }}>
            We&apos;re building this now. Check back soon — or create a song in the meantime.
          </p>
          <div className="row center" style={{ justifyContent: "center", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/song-intake">
              Create a Song
            </Link>
            <Link className="btn btn-outline" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

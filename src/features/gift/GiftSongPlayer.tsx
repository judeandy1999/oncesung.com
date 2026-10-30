"use client";

type Props = {
  token: string;
  recipientName: string;
  filename: string;
};

export function GiftSongPlayer({ token, recipientName, filename }: Props) {
  const audioSrc = `/api/gift/${token}/audio`;
  const downloadHref = `/api/gift/${token}/audio?download=1`;

  return (
    <div className="card pad" style={{ maxWidth: 560, margin: "0 auto" }}>
      <span className="badge green">Your song</span>
      <h1 style={{ marginTop: 12 }}>{recipientName ? `For ${recipientName}` : "A song for you"}</h1>
      <p className="muted">Press play to listen, or download the file to keep.</p>
      <audio controls style={{ width: "100%", marginTop: 16 }} src={audioSrc} preload="metadata">
        Your browser does not support audio playback.
      </audio>
      <div style={{ marginTop: 20 }}>
        <a className="btn btn-primary" href={downloadHref} download={filename}>
          Download
        </a>
      </div>
    </div>
  );
}

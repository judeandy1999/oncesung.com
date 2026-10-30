"use client";

import { useId, useState } from "react";
import { Upload } from "lucide-react";

export function AdminSongUploadForm({
  orderId,
  hasFile,
}: {
  orderId: string;
  hasFile: boolean;
}) {
  const inputId = useId();
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("song");
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;

    setUploading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/song`, {
        method: "POST",
        body: new FormData(form),
        credentials: "same-origin",
        redirect: "follow",
      });
      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }
      if (response.ok) {
        window.location.assign(`/admin/orders?uploaded=${encodeURIComponent(orderId)}`);
        return;
      }
      setError("The song could not be uploaded. Check the file type and size, then try again.");
    } catch {
      setError("The song could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={(event) => void onSubmit(event)} encType="multipart/form-data" style={{ marginTop: 12 }}>
      <p className="small muted" style={{ margin: "0 0 8px" }}>
        MP3 or WAV, up to 50 MB
      </p>
      <div className="file-row" style={{ marginBottom: 12 }}>
        <span
          style={{
            color: "var(--coral)",
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
          aria-hidden
        >
          <Upload size={22} strokeWidth={1.8} />
        </span>
        <div className="grow">
          <b>{fileName || "No file selected"}</b>
          <span className="xs muted">Choose an audio file from your computer</span>
        </div>
        <label className="btn btn-outline btn-sm" htmlFor={inputId} style={{ cursor: "pointer", margin: 0 }}>
          Choose file
        </label>
        <input
          id={inputId}
          type="file"
          name="song"
          accept="audio/mpeg,audio/wav,.mp3,.wav"
          required
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileName(file?.name ?? "");
          }}
        />
      </div>
      <button className="btn btn-primary btn-sm" type="submit" disabled={!fileName || uploading}>
        {uploading ? "Uploading…" : hasFile ? "Replace song" : "Upload song"}
      </button>
      {error ? (
        <p className="xs" style={{ color: "var(--coral-ink)", margin: "8px 0 0" }}>
          {error}
        </p>
      ) : null}
      {!fileName && !hasFile ? (
        <p className="xs muted" style={{ margin: "8px 0 0" }}>
          Pick a file first, then upload.
        </p>
      ) : null}
    </form>
  );
}

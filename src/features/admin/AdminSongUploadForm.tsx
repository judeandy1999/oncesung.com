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

  return (
    <form
      action={`/api/admin/orders/${orderId}/song`}
      method="post"
      encType="multipart/form-data"
      style={{ marginTop: 12 }}
    >
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
      <button className="btn btn-primary btn-sm" type="submit" disabled={!fileName}>
        {hasFile ? "Replace song" : "Upload song"}
      </button>
      {!fileName && !hasFile ? (
        <p className="xs muted" style={{ margin: "8px 0 0" }}>
          Pick a file first, then upload.
        </p>
      ) : null}
    </form>
  );
}

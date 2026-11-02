"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  limitForType,
  limitsForPackage,
  PACKAGE_DISPLAY,
  type ChangeRequestType,
} from "@/lib/revisions/limits";
import { orderSongLabel } from "@/lib/revisions/order-label";
import type {
  EligibleRevisionOrder,
  SongChangeRequestWithMessages,
} from "@/lib/revisions/queries";

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function countUsed(
  requests: SongChangeRequestWithMessages[],
  orderId: string,
  type: ChangeRequestType,
) {
  return requests.filter(
    (r) => r.order_id === orderId && r.request_type === type && r.status !== "cancelled",
  ).length;
}

type Props = {
  eligibleOrders: EligibleRevisionOrder[];
  initialRequests: SongChangeRequestWithMessages[];
};

export function RevisionsRemakesPanel({ eligibleOrders, initialRequests }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "remake" ? "remake" : "revision";

  const [requests, setRequests] = useState(initialRequests);
  const [requestType, setRequestType] = useState<ChangeRequestType>(initialType);
  const [orderId, setOrderId] = useState(eligibleOrders[0]?.id ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [revisionDetails, setRevisionDetails] = useState("");
  const [revisionParts, setRevisionParts] = useState<string[]>([]);
  const [revisionTimes, setRevisionTimes] = useState("");
  const [revisionKeep, setRevisionKeep] = useState("");

  const [remakeDirection, setRemakeDirection] = useState("");
  const [remakeChange, setRemakeChange] = useState<string[]>([]);
  const [remakeKeep, setRemakeKeep] = useState("");
  const [remakeRef, setRemakeRef] = useState("");

  const selectedOrder = useMemo(
    () => eligibleOrders.find((o) => o.id === orderId) ?? null,
    [eligibleOrders, orderId],
  );

  const packageKey = selectedOrder?.package_key ?? null;

  const allowance = useMemo(() => {
    if (!packageKey || !orderId) {
      return { revisionsLeft: 0, remakesLeft: 0, revisionMax: 0, remakeMax: 0 };
    }
    const limits = limitsForPackage(packageKey);
    const usedR = countUsed(requests, orderId, "revision");
    const usedM = countUsed(requests, orderId, "remake");
    return {
      revisionsLeft: Math.max(0, limits.revision - usedR),
      remakesLeft: Math.max(0, limits.remake - usedM),
      revisionMax: limits.revision,
      remakeMax: limits.remake,
    };
  }, [packageKey, orderId, requests]);

  const blockMessage = useMemo(() => {
    if (!packageKey || !orderId) return "Choose a delivered song from your orders.";
    if (requestType === "remake" && allowance.remakeMax === 0) {
      return "Remakes aren’t included in the Essential package. You can still ask for a minor revision.";
    }
    if (requestType === "remake" && allowance.remakesLeft <= 0) {
      return "You’ve used all the remakes included in your package for this song. Send a minor revision, or write to us in the conversation below.";
    }
    if (requestType === "revision" && allowance.revisionsLeft <= 0) {
      return "You’ve used all the minor revisions included in your package for this song. You can still reply in the conversation below.";
    }
    return null;
  }, [allowance, orderId, packageKey, requestType]);

  const submitDisabled = !selectedOrder || Boolean(blockMessage) || submitting;

  function switchType(next: ChangeRequestType) {
    setRequestType(next);
    setSubmitError(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", next);
    router.replace(`/requests?${params.toString()}`, { scroll: false });
  }

  function toggleInList(list: string[], value: string, on: boolean) {
    if (on) return [...list, value];
    return list.filter((v) => v !== value);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrder || submitDisabled) return;

    const fields: Record<string, string> = {};
    if (requestType === "revision") {
      fields["What to change"] = revisionDetails;
      if (revisionParts.length) fields.Parts = revisionParts.join(", ");
      if (revisionTimes.trim()) fields.Timestamps = revisionTimes.trim();
      if (revisionKeep.trim()) fields["Keep as it is"] = revisionKeep.trim();
    } else {
      fields["New direction"] = remakeDirection;
      if (remakeChange.length) fields.Change = remakeChange.join(", ");
      if (remakeKeep.trim()) fields.Keep = remakeKeep.trim();
      if (remakeRef.trim()) fields.Reference = remakeRef.trim();
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/revision-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          requestType,
          fields,
        }),
      });
      const body = (await res.json()) as { error?: string; requests?: SongChangeRequestWithMessages[] };
      if (!res.ok) {
        setSubmitError(body.error ?? "Could not send your request.");
        return;
      }
      if (body.requests) setRequests(body.requests);
      if (requestType === "revision") {
        setRevisionDetails("");
        setRevisionParts([]);
        setRevisionTimes("");
        setRevisionKeep("");
      } else {
        setRemakeDirection("");
        setRemakeChange([]);
        setRemakeKeep("");
        setRemakeRef("");
      }
    } catch {
      setSubmitError("Could not send your request. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReply(requestId: string, body: string) {
    const res = await fetch(`/api/revision-requests/${requestId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = (await res.json()) as { error?: string; requests?: SongChangeRequestWithMessages[] };
    if (!res.ok) throw new Error(data.error ?? "Could not send.");
    if (data.requests) setRequests(data.requests);
  }

  const orderLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of eligibleOrders) map.set(o.id, orderSongLabel(o));
    return map;
  }, [eligibleOrders]);

  return (
    <>
      <div className="row between">
        <div>
          <h1 style={{ fontSize: 38, margin: 0 }}>Revisions &amp; Remakes</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Ask for changes to your delivered song and keep the conversation with your songwriter in one place.
          </p>
        </div>
      </div>

      <div className="card pad" style={{ marginTop: 18 }} id="new-request">
        <h2 style={{ fontSize: 24, margin: 0 }}>New request</h2>

        {eligibleOrders.length === 0 ? (
          <p className="muted" style={{ marginTop: 14 }}>
            When a song is delivered to your account, it will appear here so you can request revisions or remakes.{" "}
            <Link className="link" href="/dashboard">
              View My Orders
            </Link>
          </p>
        ) : (
          <>
            <div className="rq-tabs" role="tablist" aria-label="Request type">
              <button
                type="button"
                className="rq-tab"
                role="tab"
                aria-selected={requestType === "revision"}
                onClick={() => switchType("revision")}
              >
                <b>Minor revision</b>
                <span>Small fixes: a word, a name, the mix or the ending</span>
              </button>
              <button
                type="button"
                className="rq-tab"
                role="tab"
                aria-selected={requestType === "remake"}
                onClick={() => switchType("remake")}
              >
                <b>Remake</b>
                <span>A new take with a different style, voice or feel</span>
              </button>
            </div>

            <form onSubmit={onSubmit} noValidate style={{ marginTop: 14 }}>
              {submitError ? (
                <div className="err-msg" role="alert">
                  {submitError}
                </div>
              ) : null}

              <div className="rq-grid">
                <div className="field">
                  <label className="lbl" htmlFor="rq-song">
                    Which song? <span className="req">*</span>
                  </label>
                  <select
                    className="input"
                    id="rq-song"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  >
                    {eligibleOrders.length === 0 ? (
                      <option value="">No delivered songs yet</option>
                    ) : (
                      eligibleOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {orderSongLabel(o)}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="field">
                  <label className="lbl" htmlFor="rq-package">
                    Your package <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    id="rq-package"
                    readOnly
                    value={packageKey ? PACKAGE_DISPLAY[packageKey] : "—"}
                    aria-readonly="true"
                  />
                </div>
              </div>

              <div className="allow" id="rq-allow">
                <span className="pill">
                  Minor revisions:{" "}
                  <b>
                    {allowance.revisionsLeft} of {allowance.revisionMax} left
                  </b>
                </span>
                <span className="pill">
                  Remakes:{" "}
                  <b>
                    {allowance.remakesLeft} of {allowance.remakeMax} left
                  </b>
                </span>
              </div>
              {blockMessage ? (
                <p className="allow-note" id="rq-allow-note">
                  {blockMessage}
                </p>
              ) : null}

              {requestType === "revision" ? (
                <div data-for="revision">
                  <div className="field">
                    <label className="lbl" htmlFor="rv-details">
                      What should we change? <span className="req">*</span>
                    </label>
                    <textarea
                      className="textarea"
                      id="rv-details"
                      style={{ minHeight: 120 }}
                      maxLength={1500}
                      value={revisionDetails}
                      onChange={(e) => setRevisionDetails(e.target.value)}
                      placeholder='e.g. In the second verse, please change "rainy night" to "summer night".'
                    />
                  </div>
                  <RevisionOptionalFields
                    parts={revisionParts}
                    onParts={setRevisionParts}
                    times={revisionTimes}
                    onTimes={setRevisionTimes}
                    keep={revisionKeep}
                    onKeep={setRevisionKeep}
                  />
                </div>
              ) : (
                <div data-for="remake">
                  <div className="field">
                    <label className="lbl" htmlFor="rm-direction">
                      What should the new version be like? <span className="req">*</span>
                    </label>
                    <textarea
                      className="textarea"
                      id="rm-direction"
                      style={{ minHeight: 120 }}
                      maxLength={1500}
                      value={remakeDirection}
                      onChange={(e) => setRemakeDirection(e.target.value)}
                    />
                  </div>
                  <RemakeOptionalFields
                    change={remakeChange}
                    onChange={setRemakeChange}
                    keep={remakeKeep}
                    onKeep={setRemakeKeep}
                    refText={remakeRef}
                    onRef={setRemakeRef}
                  />
                </div>
              )}

              <div className="row" style={{ marginTop: 18 }}>
                <button className="btn btn-primary" type="submit" disabled={submitDisabled}>
                  {submitting ? "Sending…" : "Send request"}
                </button>
                <span className="xs muted">Your songwriter replies here, in the conversation below.</span>
              </div>
            </form>
          </>
        )}
      </div>

      <div style={{ marginTop: 30 }} className="row between">
        <div>
          <h2 style={{ fontSize: 28, margin: 0 }}>Your conversations</h2>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Every request, with its follow-up messages.
          </p>
        </div>
        <span className="xs muted">
          {requests.length
            ? `${requests.length} request${requests.length === 1 ? "" : "s"}`
            : ""}
        </span>
      </div>

      <div id="threads">
        {requests.length === 0 ? (
          <div className="card pad center" style={{ marginTop: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              No requests yet. When you send a revision or remake request, the conversation appears here.
            </p>
          </div>
        ) : (
          requests.map((r) => (
            <RequestThread
              key={r.id}
              request={r}
              songTitle={orderLabels.get(r.order_id) ?? "Your song"}
              onReply={onReply}
            />
          ))
        )}
      </div>
    </>
  );
}

function RevisionOptionalFields(props: {
  parts: string[];
  onParts: (v: string[]) => void;
  times: string;
  onTimes: (v: string) => void;
  keep: string;
  onKeep: (v: string) => void;
}) {
  const partOptions = [
    "Lyrics wording",
    "Name pronunciation",
    "Vocal delivery",
    "Volume or mix",
    "Intro or ending",
    "Something else",
  ];

  return (
    <>
      <details className="opt">
        <summary>
          Which parts need a fix? <span className="tag">Optional</span>
        </summary>
        <div className="checks">
          {partOptions.map((label) => (
            <label key={label}>
              <input
                type="checkbox"
                checked={props.parts.includes(label)}
                onChange={(e) =>
                  props.onParts(toggleCheckboxList(props.parts, label, e.target.checked))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </details>
      <details className="opt">
        <summary>
          Timestamps <span className="tag">Optional</span>
        </summary>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          maxLength={600}
          value={props.times}
          onChange={(e) => props.onTimes(e.target.value)}
        />
      </details>
      <details className="opt">
        <summary>
          What must stay exactly as it is? <span className="tag">Optional</span>
        </summary>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          maxLength={600}
          value={props.keep}
          onChange={(e) => props.onKeep(e.target.value)}
        />
      </details>
    </>
  );
}

function RemakeOptionalFields(props: {
  change: string[];
  onChange: (v: string[]) => void;
  keep: string;
  onKeep: (v: string) => void;
  refText: string;
  onRef: (v: string) => void;
}) {
  const changeOptions = ["Style or genre", "Vocals", "Tempo or energy", "Instruments", "Mood"];

  return (
    <>
      <details className="opt">
        <summary>
          What should change? <span className="tag">Optional</span>
        </summary>
        <div className="checks">
          {changeOptions.map((label) => (
            <label key={label}>
              <input
                type="checkbox"
                checked={props.change.includes(label)}
                onChange={(e) =>
                  props.onChange(toggleCheckboxList(props.change, label, e.target.checked))
                }
              />
              {label}
            </label>
          ))}
        </div>
      </details>
      <details className="opt">
        <summary>
          What should we keep? <span className="tag">Optional</span>
        </summary>
        <textarea
          className="textarea"
          style={{ minHeight: 70 }}
          maxLength={600}
          value={props.keep}
          onChange={(e) => props.onKeep(e.target.value)}
        />
      </details>
      <details className="opt">
        <summary>
          Reference song <span className="tag">Optional</span>
        </summary>
        <input
          className="input"
          maxLength={300}
          value={props.refText}
          onChange={(e) => props.onRef(e.target.value)}
        />
      </details>
    </>
  );
}

function toggleCheckboxList(list: string[], value: string, on: boolean) {
  if (on) return [...list, value];
  return list.filter((v) => v !== value);
}

function RequestThread({
  request,
  songTitle,
  onReply,
}: {
  request: SongChangeRequestWithMessages;
  songTitle: string;
  onReply: (requestId: string, body: string) => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const label = request.request_type === "remake" ? "Remake" : "Minor revision";
  const max = limitForType(request.package_key, request.request_type);

  async function submitReply(e: FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      await onReply(request.id, text);
      setReply("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="card pad thread" id={`t-${request.id}`}>
      <div className="thread-head">
        <div>
          <h3>
            {label} {request.sequence_number} of {max} · {songTitle}
          </h3>
          <div className="xs muted" style={{ marginTop: 4 }}>
            {PACKAGE_DISPLAY[request.package_key]} package · sent {formatWhen(request.created_at)}
          </div>
        </div>
        <span className="badge">{request.status === "sent" ? "Sent" : request.status.replace("_", " ")}</span>
      </div>
      <div className="msgs">
        <div className="msg you">
          <span className="meta">You · {formatWhen(request.created_at)}</span>
          <b>{label} request</b>
          <dl>
            {Object.entries(request.fields).map(([k, v]) => (
              <span key={k} style={{ display: "contents" }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </span>
            ))}
          </dl>
        </div>
        {request.messages.map((m) => (
          <div key={m.id} className={`msg${m.sender_role === "customer" ? " you" : ""}`}>
            <span className="meta">
              {m.sender_role === "customer" ? "You" : "Your songwriter"} · {formatWhen(m.created_at)}
            </span>
            {m.body}
          </div>
        ))}
      </div>
      <form className="reply" onSubmit={submitReply}>
        <label className="sr-only" htmlFor={`reply-${request.id}`}>
          Add a message
        </label>
        <textarea
          className="textarea"
          id={`reply-${request.id}`}
          maxLength={1500}
          placeholder="Add a message about this request…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <button className="btn btn-ghost btn-sm" type="submit" disabled={sending}>
          Send
        </button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}

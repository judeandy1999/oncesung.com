const MAX_STORY_BYTES = 100_000;

const FIELD_LABELS: Record<string, string> = {
  occasion: "Occasion",
  service: "Creation type",
  recipient: "Recipient",
  giver: "From",
  relationship: "Relationship",
  date: "Event date",
  genre: "Style",
  mood: "Mood",
  moments: "Key moments",
  details: "Message",
  message: "Message",
  contactName: "Contact name",
  contactEmail: "Contact email",
  notes: "Notes from checkout",
  story: "Featured memory",
  genre_mix: "Style mix",
  perspective: "Perspective",
  name_instruction: "Name instruction",
  exclude: "Leave out",
  phonetic_ok: "Phonetic spelling",
  event_date: "Event date",
};

export type StoryBriefSection = { title: string; body: string };

export function storyByteLength(story: unknown): number {
  return new TextEncoder().encode(JSON.stringify(story)).length;
}

export function isStoryWithinLimit(story: unknown): boolean {
  return storyByteLength(story) <= MAX_STORY_BYTES;
}

function storyRecord(story: unknown): Record<string, unknown> | null {
  if (!story || typeof story !== "object" || Array.isArray(story)) return null;
  return story as Record<string, unknown>;
}

function pickString(story: unknown, key: string): string {
  const root = storyRecord(story);
  if (!root) return "";
  const top = root[key];
  if (typeof top === "string" && top.trim()) return top.replace(/\s+/g, " ").trim().slice(0, 200);
  const answers = root.answers;
  if (answers && typeof answers === "object" && !Array.isArray(answers)) {
    const nested = (answers as Record<string, unknown>)[key];
    if (typeof nested === "string" && nested.trim()) return nested.replace(/\s+/g, " ").trim().slice(0, 200);
  }
  return "";
}

export function recipientFromStory(story: unknown): string {
  return pickString(story, "recipient");
}

export function occasionFromStory(story: unknown): string {
  return pickString(story, "occasion") || pickString(story, "service");
}

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function linesFromObject(obj: Record<string, unknown>, skip = new Set<string>()): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (skip.has(key)) continue;
    if (typeof value === "string" && value.trim()) lines.push(`${labelFor(key)}: ${value.trim()}`);
    else if (Array.isArray(value)) {
      const text = value
        .filter((item) => typeof item === "string" && item.trim())
        .map((item) => (item as string).trim())
        .join("\n");
      if (text) lines.push(`${labelFor(key)}:\n${text}`);
    }
  }
  return lines;
}

function sectionsFromBriefJson(json: unknown): StoryBriefSection[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  const pack = json as Record<string, unknown>;
  const sections: StoryBriefSection[] = [];
  const answers = pack.answers;
  if (answers && typeof answers === "object" && !Array.isArray(answers)) {
    const body = linesFromObject(answers as Record<string, unknown>).join("\n");
    if (body) sections.push({ title: "Purpose & details", body });
  }
  const storyDetails = pack.story_details;
  if (Array.isArray(storyDetails)) {
    const body = storyDetails
      .filter((item) => typeof item === "string" && item.trim())
      .map((item, i) => `${i + 1}. ${(item as string).trim()}`)
      .join("\n");
    if (body) sections.push({ title: "Specific details", body });
  }
  const names = pack.names;
  if (Array.isArray(names)) {
    const body = names
      .filter((n) => n && typeof n === "object")
      .map((n) => {
        const row = n as { name?: string; hint?: string; stress?: string };
        if (!row.name?.trim()) return "";
        return [row.name.trim(), row.hint?.trim(), row.stress ? `Stress: ${row.stress}` : ""].filter(Boolean).join(" · ");
      })
      .filter(Boolean)
      .join("\n");
    if (body) sections.push({ title: "Names & pronunciation", body });
  }
  const phrases = pack.requested_phrases;
  if (Array.isArray(phrases)) {
    const body = phrases
      .filter((p) => p && typeof p === "object")
      .map((p) => {
        const row = p as { text?: string; meaning?: string; locked?: boolean };
        if (!row.text?.trim()) return "";
        const prefix = row.locked ? "EXACT: " : "";
        return `${prefix}${row.text.trim()}${row.meaning ? ` — ${row.meaning.trim()}` : ""}`;
      })
      .filter(Boolean)
      .join("\n");
    if (body) sections.push({ title: "Phrases to include", body });
  }
  const moods = pack.moods;
  if (Array.isArray(moods) && moods.length) {
    sections.push({ title: "Mood", body: moods.filter((m) => typeof m === "string").join(", ") });
  }
  const refs = pack.musical_references;
  if (Array.isArray(refs)) {
    const body = refs
      .filter((r) => r && typeof r === "object")
      .map((r) => {
        const row = r as { url?: string; traits?: string; aspects?: string[] };
        return [row.url?.trim(), row.traits?.trim(), row.aspects?.length ? `Aspects: ${row.aspects.join(", ")}` : ""]
          .filter(Boolean)
          .join(" | ");
      })
      .filter(Boolean)
      .join("\n");
    if (body) sections.push({ title: "Musical references", body });
  }
  const messages = pack.detailed_messages;
  if (Array.isArray(messages)) {
    const body = messages
      .filter((m) => m && typeof m === "object")
      .map((m) => {
        const row = m as { question?: string; answer?: string };
        if (!row.answer?.trim()) return "";
        return `${row.question?.trim() || "Detail"}:\n${row.answer.trim()}`;
      })
      .filter(Boolean)
      .join("\n\n");
    if (body) sections.push({ title: "Detailed messages", body });
  }
  return sections;
}

/** Readable brief for admin / owner — supports checkout summary, full intake JSON, and saved brief text. */
export function storyBriefSections(story: unknown): StoryBriefSection[] {
  const root = storyRecord(story);
  if (!root) return [];

  if (typeof root.briefText === "string" && root.briefText.trim()) {
    return [{ title: "Song brief", body: root.briefText.trim().slice(0, 24000) }];
  }

  const sections: StoryBriefSection[] = [];

  const summaryKeys = [
    "occasion",
    "service",
    "recipient",
    "relationship",
    "giver",
    "date",
    "genre",
    "mood",
    "moments",
    "details",
    "message",
  ];
  const summaryLines = summaryKeys
    .map((key) => {
      const value = root[key];
      if (typeof value !== "string" || !value.trim()) return null;
      return `${labelFor(key)}: ${value.trim()}`;
    })
    .filter(Boolean) as string[];
  if (summaryLines.length) sections.push({ title: "Story summary", body: summaryLines.join("\n") });

  const answers = root.answers;
  if (answers && typeof answers === "object" && !Array.isArray(answers)) {
    const skip = new Set<string>();
    if (pickString(root, "recipient")) skip.add("recipient");
    if (pickString(root, "relationship")) skip.add("relationship");
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
      if (!skip.has(key)) filtered[key] = value;
    }
    const body = linesFromObject(filtered).join("\n");
    if (body) sections.push({ title: "Contact & extras", body });
  }

  const storyDetails = root.story_details;
  if (Array.isArray(storyDetails)) {
    const body = storyDetails
      .filter((item) => typeof item === "string" && item.trim())
      .map((item, i) => `${i + 1}. ${(item as string).trim()}`)
      .join("\n");
    if (body) sections.push({ title: "Specific details", body });
  }

  if (root.briefJson) {
    sections.push(...sectionsFromBriefJson(root.briefJson));
  } else if (root.schema && typeof root.schema === "string") {
    sections.push(...sectionsFromBriefJson(root));
  }

  return sections;
}

export function storyForOwner(story: unknown): string {
  return storyBriefSections(story)
    .map((section) => `${section.title}\n${section.body}`)
    .join("\n\n")
    .slice(0, 8000);
}

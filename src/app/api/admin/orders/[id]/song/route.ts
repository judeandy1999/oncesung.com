import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/orders/admin";
import { notifySongReady } from "@/lib/email/notify";
import { getOrderById } from "@/lib/orders/record";

const paramsSchema = z.string().uuid();
const MAX_BYTES = 50 * 1024 * 1024;

const MIME_TO_STORAGE: Record<string, string> = {
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
};

function extensionFor(mime: string, filename: string): "mp3" | "wav" | null {
  if (MIME_TO_STORAGE[mime] === "audio/wav") return "wav";
  if (MIME_TO_STORAGE[mime] === "audio/mpeg") return "mp3";
  const lower = filename.toLowerCase();
  if (lower.endsWith(".wav")) return "wav";
  if (lower.endsWith(".mp3")) return "mp3";
  return null;
}

function safeFilename(name: string, extension: "mp3" | "wav"): string {
  const base = (name.split(/[/\\]/).pop() ?? "song").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base || "song"}.${extension}`;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const back = new URL("/admin/orders", request.url);
  if (!paramsSchema.safeParse(id).success) {
    back.searchParams.set("error", "That order could not be found.");
    return NextResponse.redirect(back);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/admin/orders");
    return NextResponse.redirect(login);
  }
  if (!isAdminEmail(user.email)) {
    back.searchParams.set("error", "Only the site owner can upload a song.");
    return NextResponse.redirect(back);
  }

  const order = await getOrderById(id);
  if (!order || order.status !== "paid") {
    back.searchParams.set("error", "Upload a song only after the customer has paid.");
    return NextResponse.redirect(back);
  }
  const form = await request.formData();
  const file = form.get("song");
  if (!(file instanceof File) || file.size === 0) {
    back.searchParams.set("error", "Choose an MP3 or WAV file.");
    return NextResponse.redirect(back);
  }
  if (file.size > MAX_BYTES) {
    back.searchParams.set("error", "The file must be 50 MB or smaller.");
    return NextResponse.redirect(back);
  }
  const extension = extensionFor(file.type, file.name);
  if (!extension) {
    back.searchParams.set("error", "Upload an MP3 or WAV file.");
    return NextResponse.redirect(back);
  }

  const storagePath = `${order.id}/song.${extension}`;
  const contentType = extension === "wav" ? "audio/wav" : "audio/mpeg";
  const filename = safeFilename(file.name, extension);

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from("purchased-songs").upload(storagePath, file, {
      contentType,
      upsert: true,
    });
    if (uploadError) {
      back.searchParams.set("error", "The song file could not be stored. Check that the purchased-songs bucket exists.");
      return NextResponse.redirect(back);
    }
    const { error: updateError } = await admin
      .from("orders")
      .update({
        song_storage_path: storagePath,
        song_filename: filename,
        song_content_type: contentType,
      })
      .eq("id", order.id)
      .eq("status", "paid");
    if (updateError) {
      back.searchParams.set("error", "The file was stored but the order was not updated.");
      return NextResponse.redirect(back);
    }
    const ready = await getOrderById(order.id);
    if (ready) {
      const delivery = await notifySongReady(ready);
      back.searchParams.set("uploaded", order.id);
      if (delivery.buyerSent) back.searchParams.set("buyer", "1");
      if (delivery.giftSent) back.searchParams.set("gift", "1");
      if (delivery.issues.length) back.searchParams.set("delivery", delivery.issues.join(" · "));
      return NextResponse.redirect(back);
    }
  } catch (err) {
    console.error(err);
    back.searchParams.set("error", "The song file could not be stored.");
    return NextResponse.redirect(back);
  }

  back.searchParams.set("uploaded", order.id);
  return NextResponse.redirect(back);
}

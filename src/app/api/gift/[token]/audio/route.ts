import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderByGiftToken } from "@/lib/orders/record";

const paramsSchema = z.string().uuid();

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!paramsSchema.safeParse(token).success) return new NextResponse("Not found", { status: 404 });

  const order = await getOrderByGiftToken(token).catch(() => null);
  if (!order?.song_storage_path) return new NextResponse("Not found", { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("purchased-songs").download(order.song_storage_path);
  if (error || !data) return new NextResponse("Not found", { status: 404 });

  const download = new URL(request.url).searchParams.get("download") === "1";
  const filename = (order.song_filename || "song").replace(/["\r\n]/g, "");
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": order.song_content_type || "audio/mpeg",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderById } from "@/lib/orders/record";

const paramsSchema = z.string().uuid();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!paramsSchema.safeParse(id).success) return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in", { status: 401 });

  const order = await getOrderById(id).catch(() => null);
  if (!order || order.user_id !== user.id || order.status !== "paid" || !order.song_storage_path) {
    return new NextResponse("Not found", { status: 404 });
  }

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

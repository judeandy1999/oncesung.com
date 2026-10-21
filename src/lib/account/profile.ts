import { createClient } from "@/lib/supabase/server";

export type OwnProfile = {
  fullName: string;
  email: string;
};

function metadataName(metadata: Record<string, unknown> | undefined) {
  const fullName = metadata?.full_name;
  const name = metadata?.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return "";
}

export async function getOwnProfile(): Promise<OwnProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  const fullName = (data?.full_name || metadataName(user.user_metadata)).trim().slice(0, 100);
  return {
    fullName,
    email: data?.email || user.email || "",
  };
}

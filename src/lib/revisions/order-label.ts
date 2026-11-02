function orderReference(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function orderSongLabel(input: {
  id: string;
  recipient_name: string;
  occasion: string;
}): string {
  const name = input.recipient_name?.trim();
  const base = name ? `"${name}"` : "Your song";
  const occasion = input.occasion?.trim();
  if (occasion) return `${base} · ${occasion}`;
  return `${base} · Order ${orderReference(input.id)}`;
}

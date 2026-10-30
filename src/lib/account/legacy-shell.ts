/** Drops the legacy HTML sidebar shell; keep the main column markup only. */
export function stripLegacyAccountShell(html: string): string {
  const match = html.match(/<\/aside>\s*(<div>[\s\S]*)<\/div>\s*<\/div>\s*<\/section>/i);
  if (!match) return html;
  return `${match[1]}</div>`;
}

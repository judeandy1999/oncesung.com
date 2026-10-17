/** Server-safe HTML main from the design ZIP (links pre-rewritten). */
export function HtmlMain({ html, className }: { html: string; className?: string }) {
  return (
    <div className={className} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
  );
}

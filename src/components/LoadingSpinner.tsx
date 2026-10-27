export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="ui-loading" role="status" aria-live="polite">
      <span className="ui-spinner" aria-hidden />
      {label ? <span className="xs muted">{label}</span> : null}
    </div>
  );
}

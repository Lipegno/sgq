export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7.5" />
      <path d="M8 11.2l2.2 2.3L14.5 9" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

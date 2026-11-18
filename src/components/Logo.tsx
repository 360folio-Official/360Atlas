import Link from "next/link";

// Globe mark with an orbit ring, plus the wordmark.
export default function Logo({ href }: { href: string }) {
  return (
    <Link
      href={href}
      dir="ltr"
      className="flex items-center gap-2 text-xl font-bold tracking-tight"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="11" fill="none" stroke="var(--glow)" strokeWidth="2" />
        <ellipse cx="16" cy="16" rx="5" ry="11" fill="none" stroke="var(--glow)" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d="M5 16h22" stroke="var(--glow)" strokeOpacity="0.6" strokeWidth="1.5" />
        <ellipse
          cx="16"
          cy="16"
          rx="15"
          ry="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="rotate(-20 16 16)"
        />
      </svg>
      <span>
        <span className="text-glow">360</span>atlas
      </span>
    </Link>
  );
}

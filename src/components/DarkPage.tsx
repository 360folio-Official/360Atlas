import Link from "next/link";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

// Dark page layout matching the homepage hero and map: a starry title band,
// then content on the deep ink background, running straight into the footer.
export default function DarkPage({
  eyebrow,
  title,
  intro,
  header,
  aside,
  hue,
  children,
}: {
  eyebrow?: { label: string; href?: string };
  title: React.ReactNode;
  intro?: React.ReactNode;
  // Extra content under the intro, such as a search box or chips.
  header?: React.ReactNode;
  // Shown beside the title on wide screens (an enquiry card, an avatar).
  aside?: React.ReactNode;
  // Tints the band's glow, e.g. with a category's colour.
  hue?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="full-bleed min-h-[60vh] bg-ink text-white">
      <section className="hero-space relative isolate overflow-hidden border-b border-white/10">
        {hue !== undefined && (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-60"
            style={{
              background: `radial-gradient(ellipse at 80% 30%, hsl(${hue} 60% 35% / 0.55), transparent 60%)`,
            }}
          />
        )}
        <div
          aria-hidden
          className="absolute -end-32 -top-40 h-[28rem] w-[28rem] rounded-full border border-glow/15 shadow-[0_0_140px_10px] shadow-glow/10"
        />
        <div
          aria-hidden
          className="absolute -end-12 -top-20 h-64 w-64 rounded-full border border-glow/20"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="rise" style={delay(0)}>
                {eyebrow.href ? (
                  <Link
                    href={eyebrow.href}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300 hover:text-white"
                  >
                    <span className="rtl:rotate-180" aria-hidden>
                      ←
                    </span>
                    {eyebrow.label}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                    <span className="live-dot" aria-hidden />
                    {eyebrow.label}
                  </span>
                )}
              </p>
            )}
            <h1
              className="rise mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
              style={delay(120)}
            >
              {title}
            </h1>
            {intro && (
              <div
                className="rise mt-4 max-w-xl text-base text-white/65 sm:text-lg"
                style={delay(260)}
              >
                {intro}
              </div>
            )}
            {header && (
              <div className="rise mt-8" style={delay(400)}>
                {header}
              </div>
            )}
          </div>
          {aside && (
            <div className="rise shrink-0" style={delay(500)}>
              {aside}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">{children}</div>
    </div>
  );
}

// Section heading for dark pages.
export function DarkHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

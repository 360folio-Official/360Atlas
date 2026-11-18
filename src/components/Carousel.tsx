import Link from "next/link";
import CarouselTrack from "./CarouselTrack";

export default function Carousel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {href && linkLabel && (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-brand hover:text-brand-strong"
          >
            {linkLabel}
          </Link>
        )}
      </div>
      <CarouselTrack>{children}</CarouselTrack>
    </section>
  );
}

export function Slide({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`shrink-0 snap-start ${narrow ? "w-44" : "w-72"}`}>
      {children}
    </div>
  );
}

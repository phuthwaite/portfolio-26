import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import SectionHeading from "../components/SectionHeading";
import { CarouselControls } from "../components/CarouselArrows";
import { FillUnderline, LinkArrow } from "../components/LinkDecor";
import { recommendationsUrl, testimonials } from "../data/content";
import { track, trackOnce } from "../lib/analytics";

// Profile photos: src/assets/testimonials/<first-last>.(jpg|png|webp), e.g. graeme-bryce.jpg.
// Anyone without a photo gets their initials instead.
const photos = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/testimonials/*.{jpg,jpeg,png,webp}", {
      eager: true,
      import: "default",
    }),
  ).map(([path, url]) => [
    path
      .split("/")
      .pop()!
      .replace(/\.\w+$/, ""),
    url,
  ]),
);
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");

function Avatar({ name }: { name: string }) {
  const photo = photos[slug(name)];
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("");
  return (
    <span
      aria-hidden
      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium tracking-[0.04em] text-light-gray"
    >
      {initials}
    </span>
  );
}

// Time each quote stays up before the next slides in
const AUTOPLAY_MS = 9000;

// LinkedIn recommendations, in their own section after Case Studies: one large quote at a time, sliding sideways with the
// direction of travel (the outgoing quote clears before the next arrives, as in Case Studies). They
// advance on their own, slowly, looping round; the arrows (or arrow keys) still step through them and
// restart the timer. Autoplay pauses while the panel is hovered or focused, off screen or in a hidden
// tab, and is off for anyone who prefers reduced motion. The quotes are stacked in one grid cell, so
// the panel is as tall as the longest and doesn't jump between them.
export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const wrap = (i: number) => (i + count) % count;

  // `step` changes on every manual move, restarting the autoplay timer
  const [step, setStep] = useState(0);
  const goTo = (i: number) => {
    const next = wrap(i);
    setIndex(next);
    setStep((s) => s + 1);
    trackOnce("testimonial-viewed", { name: testimonials[next].name });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goTo(index + 1);
    else if (e.key === "ArrowLeft") goTo(index - 1);
    else return;
    e.preventDefault();
  };

  const panel = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false); // hovered or focused
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(panel.current!);
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const playing =
    inView &&
    !held &&
    tabVisible &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setIndex((i) => wrap(i + 1)), AUTOPLAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, step]);

  // Each hidden quote waits on the side it will arrive from: the next few to the right, the previous
  // few to the left, measured round the loop so the last-to-first wrap still slides forwards
  const sideOf = (i: number) =>
    wrap(i - index) <= count / 2 ? "translate-x-10" : "-translate-x-10";

  return (
    <section id="testimonials" aria-label="Recommendations" className="pt-[15px] pb-32 lg:flex lg:min-h-[max(681px,100vh)] lg:flex-col lg:pb-40">
      {/* on desktop the quote sits centred in the space below the title */}
      <div className="site-container lg:flex lg:flex-1 lg:flex-col">
        <SectionHeading
          aside={
            <CarouselControls
              index={index}
              count={count}
              goTo={goTo}
              loop
              prevLabel="Previous recommendation"
              nextLabel="Next recommendation"
            />
          }
        >
          Testimonials
        </SectionHeading>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Recommendations"
          ref={panel}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerEnter={() => setHeld(true)}
          onPointerLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
          className="mx-auto flex max-w-[880px] flex-col items-center gap-10 pt-14 text-center outline-none focus-visible:ring-1 focus-visible:ring-white/30 lg:flex-1 lg:justify-center lg:pt-10"
        >
          <div className="grid w-full">
            {testimonials.map((t, i) => {
              const current = i === index;
              return (
                <figure
                  key={t.name}
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${count}`}
                  aria-hidden={!current}
                  inert={!current}
                  className={`col-start-1 row-start-1 flex flex-col items-center justify-center gap-8 transition-[opacity,translate] ease-out motion-reduce:transition-none lg:gap-10 ${
                    current ? "translate-x-0 opacity-100 delay-150 duration-500" : `opacity-0 duration-300 ${sideOf(i)}`
                  }`}
                >
                  <blockquote className="relative text-[clamp(22px,2.5vw,34px)] leading-[1.4] tracking-[-0.01em] text-balance text-white">
                    <span aria-hidden className="absolute -top-[0.55em] left-1/2 -translate-x-1/2 font-display text-[3em] leading-none text-white/10 select-none">
                      “
                    </span>
                    <p className="relative">{t.quote}</p>
                  </blockquote>
                  <figcaption className="flex items-center gap-4 text-left text-[15px] leading-5">
                    <Avatar name={t.name} />
                    <span className="flex flex-col">
                      <span className="font-semibold text-white">{t.name}</span>
                      <span className="text-light-gray">{t.role}</span>
                      <span className="text-light-gray/60">{t.relationship}</span>
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          <a
            href={recommendationsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("recommendations-linkedin-click")}
            className="group cursor-new-window inline-flex w-fit flex-col gap-1 text-xs font-medium tracking-[0.2em] whitespace-nowrap text-light-gray uppercase"
          >
            <span className="inline-flex items-center gap-1.5">
              Read them in full on LinkedIn
              <LinkArrow className="size-[1.1em]" />
              <span className="sr-only">(opens in a new tab)</span>
            </span>
            <FillUnderline className="h-px" />
          </a>
        </div>
      </div>
    </section>
  );
}

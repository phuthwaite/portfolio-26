import { useEffect, useState } from "react";

// A plain note about the site's analytics, with a way to opt out, centred just above the dock and shown only
// while the Contact section is on screen. Umami is cookieless and records nothing
// that identifies anyone, so it needs no consent; this is about being open about it. Opting out uses
// Umami's own switch: while "umami.disabled" is set in this browser's storage, it sends nothing.
const KEY = "umami.disabled";

function isOptedOut() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export default function AnalyticsNote({ visible }: { visible: boolean }) {
  const [optedOut, setOptedOut] = useState(isOptedOut);
  // sits 12px above the dock, whose height varies (labels under the icons on touch screens, tooltips with
  // a mouse), so it follows the dock's measured height
  const [bottom, setBottom] = useState(96);
  useEffect(() => {
    const dock = document.getElementById("dock");
    if (!dock) return;
    const fit = () => setBottom(dock.offsetHeight + 16 + 12);
    const observer = new ResizeObserver(fit);
    observer.observe(dock);
    fit();
    return () => observer.disconnect();
  }, []);
  const toggle = () => {
    try {
      if (optedOut) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, "1");
      setOptedOut(!optedOut);
    } catch {
      // storage blocked (e.g. some private windows): nothing to change
    }
  };
  return (
    <p
      aria-hidden={!visible}
      inert={!visible}
      style={{ bottom }}
      // in front of the dock's backdrop; the dock is 16px (bottom-4) up from the bottom of the window
      className={`fixed left-0 right-[var(--scrollbar-comp,0px)] z-50 mx-auto w-fit max-w-[calc(100%-32px)] text-center text-[13px] leading-5 tracking-[0.01em] text-balance text-white/55 transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {optedOut
        ? "You’ve opted out of this site’s analytics in this browser."
        : "This site uses privacy-friendly analytics: no cookies, and nothing that identifies you."}{" "}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optedOut}
        className="cursor-pointer text-white/70 underline underline-offset-2 transition-colors hover:text-white focus-visible:text-white"
      >
        {optedOut ? "Opt back in" : "Opt out"}
      </button>
    </p>
  );
}

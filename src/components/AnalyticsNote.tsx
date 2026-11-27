import { useState } from "react";

// A plain note about the site's analytics, with a way to opt out. Umami is cookieless and records nothing
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

export default function AnalyticsNote({ className = "" }: { className?: string }) {
  const [optedOut, setOptedOut] = useState(isOptedOut);
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
    <p className={`text-[13px] leading-5 tracking-[0.01em] text-white/50 ${className}`}>
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

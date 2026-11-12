import { useLayoutEffect } from "react";

// Scales the hero down on short screens so the whole first screen – hero and client logos – fits above
// the fold without scrolling. The hero is drawn at its full size, measured, then zoomed by however much
// it needs to leave room for the logos below it (never below MIN_SCALE, never above full size). It uses
// the small viewport height (100svh), so phones don't rescale as their address bar shows and hides.
const MIN_SCALE = 0.6;

export function useHeroFit() {
  useLayoutEffect(() => {
    const hero = document.getElementById("hero");
    const logos = document.getElementById("clients");
    if (!hero || !logos) return;

    // 100svh in px, read from a hidden probe
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
    document.body.append(probe);

    const fit = () => {
      hero.style.zoom = "";
      const viewport = probe.getBoundingClientRect().height;
      const heroHeight = hero.getBoundingClientRect().height + parseFloat(getComputedStyle(hero).marginTop);
      const logosStyle = getComputedStyle(logos);
      const logosHeight = logos.getBoundingClientRect().height + parseFloat(logosStyle.marginTop);
      const scale = Math.min(1, Math.max(MIN_SCALE, (viewport - logosHeight) / heroHeight));
      if (scale < 1) hero.style.zoom = String(scale);
    };

    fit();
    window.addEventListener("resize", fit);
    document.fonts?.ready.then(fit);
    return () => {
      window.removeEventListener("resize", fit);
      probe.remove();
      hero.style.zoom = "";
    };
  }, []);
}

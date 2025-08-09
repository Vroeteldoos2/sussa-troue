// File: src/hooks/useCountdown.js
import { useEffect, useRef, useState } from "react";

export default function useCountdown(targetIsoString) {
  const [display, setDisplay] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    // Clear any existing interval when target changes/unmounts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!targetIsoString) return;

    const targetMs = new Date(targetIsoString).getTime();
    if (!Number.isFinite(targetMs)) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, targetMs - now);

      if (diff === 0) {
        setDisplay("It's the big day! 🎉");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setDisplay(`${d}d ${h}h ${m}m ${s}s`);
    };

    // kick off immediately, then every second
    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetIsoString]);

  return display;
}

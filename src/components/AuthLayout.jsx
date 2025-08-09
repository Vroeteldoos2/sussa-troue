// File: src/components/AuthLayout.jsx
import { useEffect, useMemo, useRef, useState } from "react";

const BG_URL =
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/flowers-8309997.jpg";

export default function AuthLayout({ children, slides = [], captions = [] }) {
  const [index, setIndex] = useState(0);
  const motionOK = usePrefersMotion(); // custom hook below
  const timerRef = useRef(null);

  const safeSlides = useMemo(() => slides.filter(Boolean), [slides]);
  const safeCaptions = useMemo(() => captions.filter(Boolean), [captions]);

  useEffect(() => {
    if (!safeSlides.length || !motionOK) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % safeSlides.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [safeSlides.length, motionOK]);

  const currentImg = safeSlides.length ? safeSlides[index] : null;
  const currentCaption =
    safeCaptions.length ? safeCaptions[index % safeCaptions.length] : null;

  return (
    <div
      className="min-h-screen w-full bg-center bg-cover relative"
      style={{ backgroundImage: `url(${BG_URL})` }}
      aria-label="Sunflower floral background"
      role="img"
    >
      {/* Soft grey overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {/* Form slot */}
          <div className="bg-white/85 rounded-2xl shadow-xl border border-white/60 p-6 md:p-8">
            {children}
          </div>

          {/* Slideshow */}
          <div className="rounded-2xl overflow-hidden border border-white/60 bg-white/20 backdrop-blur">
            <div className="relative h-[320px] md:h-full">
              {currentImg ? (
                <img
                  src={currentImg}
                  alt="Abraham & Jesse‑Lee"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-white/80"
                  role="status"
                >
                  Loading photos…
                </div>
              )}

              {/* gradient for caption legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

              {/* Caption */}
              {currentCaption && (
                <div className="absolute bottom-0 w-full p-4 md:p-6 text-white">
                  <p className="text-sm md:text-base leading-relaxed drop-shadow">
                    {currentCaption}
                  </p>
                </div>
              )}

              {/* Dots (interactive & a11y) */}
              {safeSlides.length > 1 && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  {safeSlides.map((_, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full outline-offset-2 focus:outline focus:outline-2 focus:outline-white ${
                        i === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Show slide ${i + 1}`}
                      aria-current={i === index ? "true" : "false"}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Mobile stacks by default via grid */}
      </div>
    </div>
  );
}

/** Small hook to respect prefers-reduced-motion */
function usePrefersMotion() {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setOk(!mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return ok;
}

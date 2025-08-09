// File: src/pages/VenuePage.jsx
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import useCountdown from "../hooks/useCountdown";
import { APP_VARS } from "../config/media";

export default function VenuePage() {
  const countdown = useCountdown(APP_VARS.WEDDING_DATE_TIME);

  return (
    <Backdrop>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="my-6 text-center text-white">
          <h1 className="text-3xl font-extrabold">
            Venue: {APP_VARS.VENUE_NAME || "To be announced"}
          </h1>
          {APP_VARS.WEDDING_DATE_TIME && (
            <p className="text-white/80 mt-1">
              Countdown: <span className="badge">{countdown}</span>
            </p>
          )}
        </header>

        <Card className="p-4 sm:p-6 text-white">
          <p className="text-white/80">{APP_VARS.VENUE_ADDRESS || "Address coming soon."}</p>

          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <iframe
              title="Venue Map"
              className="w-full h-[320px] sm:h-[420px]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                APP_VARS.VENUE_ADDRESS || "South Africa"
              )}&output=embed`}
            />
          </div>

          {APP_VARS.VENUE_ADDRESS && (
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                className="btn-primary"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  APP_VARS.VENUE_ADDRESS
                )}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Google Maps for directions"
              >
                Get Directions
              </a>
              <button
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(APP_VARS.VENUE_ADDRESS);
                  alert("Address copied to clipboard!");
                }}
              >
                Copy Address
              </button>
            </div>
          )}
        </Card>
      </div>
    </Backdrop>
  );
}

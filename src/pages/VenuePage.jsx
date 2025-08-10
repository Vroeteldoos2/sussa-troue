// File: src/pages/VenuePage.jsx
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import useCountdown from "../hooks/useCountdown";
import { APP_VARS } from "../config/media";

// Safer road coordinates (decimal from 25°30'10.9"S 27°05'40.2"E)
const SAFER_COORDINATE = "-25.503028,27.0945";

const SHOW_DISCLAIMER = true;
const DISCLAIMER_TEXT =
  "Note: One of the direct routes has a rough section. Use the ‘Safest Route’ below which follows the preferred road.";

export default function VenuePage() {
  const countdown = useCountdown(APP_VARS.WEDDING_DATE_TIME);

  const venueAddress = APP_VARS.VENUE_ADDRESS || "South Africa";
  const venueName = APP_VARS.VENUE_NAME || "To be announced";

  // Safest route link (coordinate as normal waypoint)
  const safestRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(
    venueAddress
  )}&waypoints=${encodeURIComponent(SAFER_COORDINATE)}&travelmode=driving`;

  // Fastest route link (no waypoint)
  const fastestRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${encodeURIComponent(
    venueAddress
  )}&travelmode=driving`;

  return (
    <Backdrop>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="my-6 text-center text-white">
          <h1 className="text-3xl font-extrabold">Venue: {venueName}</h1>
          {APP_VARS.WEDDING_DATE_TIME && (
            <p className="text-white/80 mt-1">
              Countdown: <span className="badge">{countdown}</span>
            </p>
          )}
        </header>

        <Card className="p-4 sm:p-6 text-white">
          <p className="text-white/80">{venueAddress || "Address coming soon."}</p>

          {SHOW_DISCLAIMER && (
            <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 text-yellow-100 p-4">
              <p className="text-sm leading-relaxed">{DISCLAIMER_TEXT}</p>
            </div>
          )}

          <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <iframe
              title="Venue Map"
              className="w-full h-[320px] sm:h-[420px]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                venueAddress
              )}&output=embed`}
            />
          </div>

          {APP_VARS.VENUE_ADDRESS && (
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Safest Route */}
              <a
                className="btn-primary"
                href={safestRouteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Safest Route (preferred road)
              </a>

              {/* Fastest Route */}
              <a
                className="btn-primary"
                href={fastestRouteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Fastest Route
              </a>

              {/* Copy Address */}
              <button
                className="btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(venueAddress);
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

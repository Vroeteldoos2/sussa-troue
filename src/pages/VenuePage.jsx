// File: src/pages/VenuePage.jsx
import Backdrop from "../components/Backdrop";
import Card from "../components/Card";
import useCountdown from "../hooks/useCountdown";
import { APP_VARS } from "../config/media";

const SAFER_WAYPOINT = "Boshoek, North West";
const SHOW_DISCLAIMER = true;
const DISCLAIMER_TEXT =
  "Note: There’s a rough section on one of the direct routes. For a smoother drive, use the ‘Safer Route via Boshoek’ below.";

export default function VenuePage() {
  const countdown = useCountdown(APP_VARS.WEDDING_DATE_TIME);

  const venueAddress = APP_VARS.VENUE_ADDRESS || "South Africa";
  const venueName = APP_VARS.VENUE_NAME || "To be announced";

  // Fastest route
  const fastestRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    venueAddress
  )}&travelmode=driving`;

  // Safer route via Boshoek
  const saferRouteUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    venueAddress
  )}&waypoints=${encodeURIComponent(SAFER_WAYPOINT)}&travelmode=driving`;

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
              {/* Safer Route - highlighted */}
              <a
                className="btn-primary"
                href={saferRouteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Safer Route via Boshoek
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

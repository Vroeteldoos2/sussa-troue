# Sunflower Wedding RSVP — Rescue Kit (No Start-Over Required)

This kit lets you convert your existing folder into a runnable React app **without re-scaffolding**.
Copy these files into your project and follow the steps in `PACKAGE_PATCH.md`.

## Files included
- `public/index.html`
- `src/index.js`, `src/index.css`
- `src/App.jsx`, `src/routes/AppRoutes.jsx`
- `src/supabaseClient.js`
- `src/config/media.js`
- `src/context/AuthProvider.jsx`
- `src/components/ProtectedRoute.jsx`, `src/components/RoleRoute.jsx`, `src/components/Navbar.jsx`
- `src/pages/*` (RSVP, ViewRSVP, UploadMedia, WeddingAlbum, LeaveMessage, MessageWall, Venue, AdminDashboard)
- `src/utils/*` (googlePicker, filename, driveUrls)
- `src/hooks/useCountdown.js`
- `tailwind.config.js` (sunflower theme)
- `postcss.config.js`

## Steps (summary)
1) Merge package.json entries from `PACKAGE_PATCH.md` (scripts + dependencies).
2) Run: `npm i`
3) Ensure `.env.local` has your REACT_APP_* variables (no comments).
4) Run: `npm start`

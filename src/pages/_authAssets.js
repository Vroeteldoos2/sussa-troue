// File: src/pages/_authAssets.js
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

const SLIDES = [
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0009.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0010.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0011.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0012.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0013.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0014.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0015.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0016.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0017.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0018.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0019.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0020.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0021.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0022.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0023.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0024.jpg",
  "https://cyxeucwesqzwlisgveiz.supabase.co/storage/v1/object/public/public-assets/IMG-20250809-WA0025.jpg",
];

const CAPTIONS = [
  "Two hearts, one promise — Abraham & Jesse‑Lee.",
  "Every day, I choose you, and I’ll keep choosing you.",
  "Hand in hand, through every season and sunrise.",
  "Love is the quiet certainty that we are home in each other.",
  "Your laugh is my favorite melody; your heart, my favorite place.",
  "Together is our greatest adventure — now and always.",
  "In your eyes, I find the future I prayed for.",
  "Rooted like sunflowers, always turning toward our light.",
  "From this day forward, we grow love in all directions.",
  "Here’s to shared coffee, shared dreams, and forever.",
];

export const AUTH_SLIDES = Object.freeze(uniq(SLIDES));
export const AUTH_CAPTIONS = Object.freeze(uniq(CAPTIONS));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sunflower: {
          50:  "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F", // secondary yellow
          400: "#FFCA28",
          500: "#FFC107", // primary yellow
          600: "#FFB300",
          700: "#FFA000",
          800: "#FF8F00",
          900: "#FF6F00",
        },
        stem: {
          300: "#81C784", // accent green light
          500: "#4CAF50", // accent green
        },
        soil: {
          300: "#B08968",
          400: "#9C7A59",
          500: "#8B6B4B", // secondary brown
          700: "#6B4E31",
        }
      },
      boxShadow: {
        soft: "0 6px 24px rgba(139,107,75,0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      }
    },
  },
  plugins: [],
};

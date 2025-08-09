// src/components/Backdrop.jsx
export default function Backdrop({ children, className = "" }) {
  return (
    <div
      className={`min-h-screen w-full bg-cover bg-center bg-fixed ${className}`}
      style={{
        backgroundImage:
          "url('https://bghqkncxbdpmmqisbbgk.supabase.co/storage/v1/object/public/public-assets//background.jpg')",
      }}
      aria-hidden="true"
    >
      <div className="min-h-screen w-full bg-black/60">{children}</div>
    </div>
  );
}

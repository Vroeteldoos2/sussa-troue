// src/components/Card.jsx
export default function Card({ children, className = "", as = "div" }) {
  const Comp = as;
  return (
    <Comp
      className={`rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur-md ${className}`}
    >
      {children}
    </Comp>
  );
}

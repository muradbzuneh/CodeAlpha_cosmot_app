import { useState, useEffect } from "react";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 1800);
    const t3 = setTimeout(() => onComplete(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ${
        phase === "exit" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div
        className={`transition-all duration-700 ease-out ${
          phase === "enter"
            ? "opacity-0 scale-90 translate-y-3"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        <img
          src="/cosmot-logo-1.png"
          alt="Cosmot"
          className="h-20 w-20 md:h-28 md:w-28 object-cover rounded-full border border-border shadow-lg"
        />
      </div>

      {/* Brand name */}
      <h1
        className={`font-display text-3xl md:text-4xl italic mt-6 tracking-tight transition-all duration-700 delay-100 ease-out ${
          phase === "enter"
            ? "opacity-0 translate-y-2"
            : "opacity-100 translate-y-0"
        }`}
      >
        Cosmot.
      </h1>

      {/* Tagline */}
      <p
        className={`text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3 transition-all duration-700 delay-200 ease-out ${
          phase === "enter"
            ? "opacity-0"
            : "opacity-100"
        }`}
      >
        Cellular Cosmetics
      </p>

      {/* Loading bar */}
      <div className="mt-10 w-32 h-[2px] bg-border rounded-full overflow-hidden">
        <div
          className={`h-full bg-foreground rounded-full transition-all ease-out ${
            phase === "enter"
              ? "w-0 duration-500"
              : phase === "hold"
              ? "w-full duration-1000"
              : "w-full duration-300"
          }`}
        />
      </div>
    </div>
  );
}

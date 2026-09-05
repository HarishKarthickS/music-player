interface VuMetersProps {
  active: boolean;
  level: number;
}

export function VuMeters({ active, level }: VuMetersProps) {
  const bars = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className={`vu ${active ? "vu-live" : ""}`} aria-hidden="true">
      <div className="vu-col">
        {bars.map((i) => (
          <span
            key={`l${i}`}
            className="vu-bar"
            style={{ animationDelay: `${i * 70}ms`, opacity: active ? 0.35 + level * 0.65 : 0.2 }}
          />
        ))}
        <p>L</p>
      </div>
      <div className="vu-col">
        {bars.map((i) => (
          <span
            key={`r${i}`}
            className="vu-bar"
            style={{ animationDelay: `${40 + i * 55}ms`, opacity: active ? 0.35 + level * 0.65 : 0.2 }}
          />
        ))}
        <p>R</p>
      </div>
    </div>
  );
}

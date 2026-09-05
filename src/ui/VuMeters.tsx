interface VuMetersProps {
  active: boolean;
  level: number;
}

export function VuMeters({ active, level }: VuMetersProps) {
  const bars = Array.from({ length: 4 }, (_, i) => i);
  return (
    <div className={`eq ${active ? "eq-live" : ""}`} aria-hidden="true">
      {bars.map((i) => (
        <span
          key={i}
          className="eq-bar"
          style={{ animationDelay: `${i * 90}ms`, opacity: active ? 0.45 + level * 0.55 : 0.25 }}
        />
      ))}
    </div>
  );
}

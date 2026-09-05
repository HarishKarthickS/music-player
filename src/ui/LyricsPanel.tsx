import type { LyricsPage } from "../domain/lyrics";

interface LyricsPanelProps {
  page: LyricsPage;
  blank: boolean;
  onChange: (body: string) => void;
  onClose: () => void;
}

export function LyricsPanel({ page, blank, onChange, onClose }: LyricsPanelProps) {
  return (
    <aside className="libretto" aria-label="Lyrics">
      <div className="libretto-head">
        <div>
          <p className="empty-kicker">Optional libretto</p>
          <h2>{page.trackHint || "No programme"}</h2>
        </div>
        <button type="button" className="ghost-key" onClick={onClose}>
          Close
        </button>
      </div>
      {blank ? (
        <p className="libretto-hint">
          Nothing written for this side. Paste lyrics if you want a crib sheet — they stay in this
          browser only.
        </p>
      ) : null}
      <textarea
        value={page.body}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Verse, chorus, spoken word…"
        rows={12}
      />
    </aside>
  );
}

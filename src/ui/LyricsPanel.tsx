import type { LyricsPage } from "../domain/lyrics";

interface LyricsPanelProps {
  page: LyricsPage;
  blank: boolean;
  onChange: (body: string) => void;
  onClose: () => void;
}

export function LyricsPanel({ page, blank, onChange, onClose }: LyricsPanelProps) {
  return (
    <aside className="libretto" aria-label="J-card lyrics">
      <div className="libretto-head">
        <div>
          <p className="empty-kicker">Fold-out J-card</p>
          <h2>{page.trackHint || "Blank insert"}</h2>
        </div>
        <button type="button" className="ghost-key" onClick={onClose}>
          Fold
        </button>
      </div>
      {blank ? (
        <p className="libretto-hint">
          This insert is empty. Paste lyrics if you want a crib on the inlay — they stay in this
          browser only.
        </p>
      ) : null}
      <textarea
        value={page.body}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Side A notes, chorus, spoken bit…"
        rows={12}
      />
    </aside>
  );
}

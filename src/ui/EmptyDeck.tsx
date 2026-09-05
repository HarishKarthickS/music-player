export function EmptyDeck() {
  return (
    <div className="empty-deck">
      <p className="empty-kicker">Platter idle</p>
      <h2>No file on the spindle</h2>
      <p>
        Drop a local wav, mp3, or ogg with Load disc. This receiver never fetches a catalog — you
        bring the records.
      </p>
    </div>
  );
}

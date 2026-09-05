# music-player

Local-file music player. Add wav/mp3/ogg from disk, play a queue, optional lyrics. Nothing leaves the machine.

## Run

```bash
npm install
npm run dev
```

Open the printed URL. You should see a dark **Listen** window with a large artwork tile and an empty queue. Use **Add files** for your own audio, or **Play sample** for a two-second generated tuning tone in `public/tuning-tone.wav` (original sine, not a licensed track).

Look: near-black Apple Music–style shell, large artwork, thin transport, rose accent, Nunito Sans.

```bash
npm run build
npm run preview
```

## Layout of the code

- `src/domain` — track, queue, player, lyrics types and pure helpers
- `src/data` — file ingest, object URLs, volume/lyrics prefs
- `src/ui` — now playing, queue, transport, empty/error, lyrics

## Screenshot

![Listen now playing with empty queue](docs/receiver.png)

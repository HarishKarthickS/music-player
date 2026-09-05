# music-player

Local-file cassette Walkman for the browser. Cue wav/mp3/ogg from disk, run a Side A matrix, optional J-card lyrics. Nothing leaves the machine.

## Run

```bash
npm install
npm run dev
```

Open the printed URL. You should see a teal-and-magenta 80s Walkman with an empty cassette window (`NO TAPE`). Use **Load tape** for your own audio, or **Pocket tone** for a two-second generated tuning tone in `public/tuning-tone.wav` (original sine, not a licensed track).

Look: glossy teal plastic shell, magenta Play key, cassette reels in the window, orange dot-matrix track list.

```bash
npm run build
npm run preview
```

## Layout of the code

- `src/domain` — track, queue, player, lyrics types and pure helpers
- `src/data` — file ingest, object URLs, volume/lyrics prefs
- `src/ui` — Walkman chrome, transport, queue, empty/fault, J-card

## Screenshot

![WM-88 Pocket Deck empty cassette](docs/receiver.png)

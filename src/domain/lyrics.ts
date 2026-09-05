export interface LyricsPage {
  trackHint: string;
  body: string;
}

export function emptyLyrics(): LyricsPage {
  return { trackHint: "", body: "" };
}

export function lyricsAreBlank(page: LyricsPage): boolean {
  return page.body.trim().length === 0;
}

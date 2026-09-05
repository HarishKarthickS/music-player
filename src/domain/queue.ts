import type { Track, TrackId } from "./track";

export interface QueueState {
  tracks: Track[];
  index: number;
}

export function emptyQueue(): QueueState {
  return { tracks: [], index: -1 };
}

export function currentTrack(queue: QueueState): Track | null {
  if (queue.index < 0 || queue.index >= queue.tracks.length) {
    return null;
  }
  return queue.tracks[queue.index] ?? null;
}

export function appendTracks(queue: QueueState, incoming: Track[]): QueueState {
  if (incoming.length === 0) {
    return queue;
  }
  const tracks = [...queue.tracks, ...incoming];
  const index = queue.index < 0 ? 0 : queue.index;
  return { tracks, index };
}

export function removeTrack(queue: QueueState, id: TrackId): QueueState {
  const oldIndex = queue.index;
  const tracks = queue.tracks.filter((t) => t.id !== id);
  if (tracks.length === 0) {
    return emptyQueue();
  }
  const removedBefore =
    oldIndex >= 0 && queue.tracks.findIndex((t) => t.id === id) < oldIndex;
  let index = removedBefore ? oldIndex - 1 : oldIndex;
  if (queue.tracks[oldIndex]?.id === id) {
    index = Math.min(index, tracks.length - 1);
  }
  index = Math.max(0, Math.min(index, tracks.length - 1));
  return { tracks, index };
}

export function selectIndex(queue: QueueState, index: number): QueueState {
  if (index < 0 || index >= queue.tracks.length) {
    return queue;
  }
  return { ...queue, index };
}

export function stepQueue(queue: QueueState, direction: 1 | -1): QueueState {
  if (queue.tracks.length === 0) {
    return emptyQueue();
  }
  const next = (queue.index + direction + queue.tracks.length) % queue.tracks.length;
  return { ...queue, index: next };
}

export function moveTrack(queue: QueueState, from: number, to: number): QueueState {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= queue.tracks.length ||
    to >= queue.tracks.length
  ) {
    return queue;
  }
  const tracks = [...queue.tracks];
  const [item] = tracks.splice(from, 1);
  if (!item) {
    return queue;
  }
  tracks.splice(to, 0, item);
  let index = queue.index;
  if (index === from) {
    index = to;
  } else if (from < index && to >= index) {
    index -= 1;
  } else if (from > index && to <= index) {
    index += 1;
  }
  return { tracks, index };
}

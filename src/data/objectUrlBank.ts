/** Object URLs for local File objects, keyed by track id. */
export class ObjectUrlBank {
  private readonly urls = new Map<string, string>();

  remember(id: string, file: File): string {
    const existing = this.urls.get(id);
    if (existing) {
      return existing;
    }
    const url = URL.createObjectURL(file);
    this.urls.set(id, url);
    return url;
  }

  get(id: string): string | undefined {
    return this.urls.get(id);
  }

  forget(id: string): void {
    const url = this.urls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.urls.delete(id);
    }
  }

  clear(): void {
    for (const id of [...this.urls.keys()]) {
      this.forget(id);
    }
  }
}

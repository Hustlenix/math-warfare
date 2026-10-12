// One direction may be held by a keyboard and several fingers at once.
export function movementKey(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(key)
    ? key : null;
}

export class MovementKeys extends Set {
  sources = new Map();

  press(source, key) {
    this.release(source);
    this.sources.set(source, key);
    this.add(key);
  }

  release(source) {
    const key = this.sources.get(source);
    this.sources.delete(source);
    if (![...this.sources.values()].includes(key)) this.delete(key);
  }

  clear() {
    this.sources.clear();
    super.clear();
  }
}

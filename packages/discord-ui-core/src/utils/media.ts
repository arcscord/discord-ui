/** Format media time without depending on locale or the system clock. */
export function formatMediaTime(seconds: number): string {
  const total = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Decode Discord's bounded base64 waveform without requiring a browser or Buffer. */
export function decodeWaveform(value: string | undefined): readonly number[] | undefined {
  if (!value || value.length > 344 || !/^(?:[a-z\d+/]{4})*(?:[a-z\d+/]{2}(?:==)?|[a-z\d+/]{3}=?)?$/iu.test(value))
    return undefined;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const samples: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of value.replace(/=+$/u, "")) {
    buffer = (buffer << 6) | alphabet.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      samples.push(((buffer >> bits) & 255) / 255);
    }
  }
  return samples.length && samples.length <= 256
    ? samples
    : undefined;
}

/** Match the fill to the center of the shared ten-pixel seek thumb. */
export function mediaProgressBackground(currentTime: number, duration: number): string {
  const progress = Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 0
    ? Math.min(1, Math.max(0, currentTime / duration))
    : 0;
  return `calc(${progress * 100}% + ${5 - progress * 10}px) 100%`;
}

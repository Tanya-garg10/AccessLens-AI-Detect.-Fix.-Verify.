type Rgb = { r: number; g: number; b: number };

function parseColor(value: string): Rgb {
  const hex = /^#?([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) return { r: parseInt(hex[1].slice(0, 2), 16), g: parseInt(hex[1].slice(2, 4), 16), b: parseInt(hex[1].slice(4, 6), 16) };
  const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(value);
  if (rgb?.[1] && rgb[2] && rgb[3]) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  throw new Error(`Unsupported color: ${value}`);
}
function luminanceChannel(channel: number): number { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
export function relativeLuminance(color: string): number { const { r, g, b } = parseColor(color); return 0.2126 * luminanceChannel(r) + 0.7152 * luminanceChannel(g) + 0.0722 * luminanceChannel(b); }
export function contrastRatio(foreground: string, background: string): number { const a = relativeLuminance(foreground); const b = relativeLuminance(background); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
function hex(color: Rgb): string { return `#${[color.r, color.g, color.b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`; }
function blend(color: Rgb, target: number, amount: number): string { return hex({ r: color.r + (target - color.r) * amount, g: color.g + (target - color.g) * amount, b: color.b + (target - color.b) * amount }); }
export function ensureContrast(foreground: string, background: string, largeText = false): { color: string; ratio: number } {
  const threshold = largeText ? 3 : 4.5;
  const current = contrastRatio(foreground, background);
  if (current >= threshold) return { color: hex(parseColor(foreground)), ratio: current };
  const original = parseColor(foreground);
  for (let step = 0.02; step <= 1; step += 0.02) for (const target of [0, 255]) { const color = blend(original, target, step); const ratio = contrastRatio(color, background); if (ratio >= threshold) return { color, ratio }; }
  throw new Error("Unable to produce accessible contrast color");
}

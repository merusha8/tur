export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export function randInt(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, rand: () => number, decimals = 1): number {
  const v = rand() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

export async function batchCreateMany<T extends Record<string, unknown>>(
  items: T[],
  batchSize: number,
  create: (batch: T[]) => Promise<{ count: number }>,
  label: string,
) {
  let total = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = await create(batch);
    total += result.count;
    if ((i / batchSize) % 10 === 0) {
      process.stdout.write(`\r  ${label}: ${total}/${items.length}`);
    }
  }
  process.stdout.write(`\r  ${label}: ${total}/${items.length} ✓\n`);
  return total;
}

export function uniqueSlug(base: string, used: Set<string>): string {
  let slug = slugify(base);
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let i = 2;
  while (used.has(`${slug}-${i}`)) i++;
  const finalSlug = `${slug}-${i}`;
  used.add(finalSlug);
  return finalSlug;
}

export function generateIata(code: string, index: number, used: Set<string>): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let attempt = 0;
  while (attempt < 1000) {
    let iata: string;
    if (attempt === 0 && code.length >= 2) {
      iata = (code[0] + code[1] + letters[index % 26]).toUpperCase();
    } else {
      iata =
        letters[Math.floor(index / 676) % 26] +
        letters[Math.floor(index / 26) % 26] +
        letters[index % 26];
    }
    if (!used.has(iata)) {
      used.add(iata);
      return iata;
    }
    index++;
    attempt++;
  }
  throw new Error('Could not generate unique IATA code');
}

export function latLngForCountry(code: string, rand: () => number): { lat: number; lng: number } {
  const zones: Record<string, [number, number, number, number]> = {
    EU: [35, 70, -10, 40],
    AS: [-10, 55, 60, 150],
    AF: [-35, 37, -18, 52],
    NA: [15, 72, -170, -50],
    SA: [-56, 12, -82, -34],
    OC: [-50, 0, 110, 180],
    AN: [-90, -60, -180, 180],
  };
  const regionMap: Record<string, keyof typeof zones> = {
    Europe: 'EU', Asia: 'AS', Africa: 'AF', Americas: 'NA', Oceania: 'OC', Antarctic: 'AN',
  };
  const zone = zones[regionMap[code as keyof typeof regionMap] || 'AS'] || zones.AS;
  return {
    lat: rand() * (zone[1] - zone[0]) + zone[0],
    lng: rand() * (zone[3] - zone[2]) + zone[2],
  };
}

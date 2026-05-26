const AIRLINE_META: Record<string, { code: string; logo?: string; color: string }> = {
  Emirates: {
    code: "EK",
    logo: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Emirates_logo.svg",
    color: "#D71921",
  },
  "Turkish Airlines": {
    code: "TK",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/Turkish_Airlines_logo_2019_compact.svg",
    color: "#C70A0C",
  },
  "Qatar Airways": {
    code: "QR",
    logo: "https://upload.wikimedia.org/wikipedia/en/9/9b/Qatar_Airways_Logo.svg",
    color: "#5C0632",
  },
  "Etihad Airways": {
    code: "EY",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Etihad-airways-logo.svg",
    color: "#BD8B13",
  },
  "Air Astana": {
    code: "KC",
    color: "#004B87",
  },
  Lufthansa: {
    code: "LH",
    logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lufthansa_Logo_2018.svg",
    color: "#05164D",
  },
  "British Airways": {
    code: "BA",
    color: "#075AAA",
  },
  Aeroflot: {
    code: "SU",
    color: "#003893",
  },
};

export function getAirlineMeta(airline: string) {
  const exact = AIRLINE_META[airline];
  if (exact) return exact;

  const partial = Object.entries(AIRLINE_META).find(([name]) =>
    airline.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(airline.toLowerCase()),
  );
  if (partial) return partial[1];

  const code = airline
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return { code: code || "—", color: "#112211" };
}

export function getAirlineLogo(airline: string) {
  return getAirlineMeta(airline).logo;
}

const nokFmt = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

export function formatNOK(v: number): string {
  return `${nokFmt.format(Math.round(v)).replace(/\u00a0/g, ' ')} kr`;
}

export function formatCompactNOK(v: number): string {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(1).replace('.', ',')} mrd`;
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(1).replace('.', ',')} mill`;
  if (a >= 1e4) return `${sign}${Math.round(a / 1e3)}k`;
  return `${sign}${nokFmt.format(Math.round(a)).replace(/\u00a0/g, ' ')}`;
}

export function formatPct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits).replace('.', ',')} %`;
}

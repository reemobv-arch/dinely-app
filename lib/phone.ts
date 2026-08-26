// Zet een ingevoerd (Nederlands) nummer om naar E.164 (+316xxxxxxxx).
// Geeft null terug als het geen geldig NL mobiel nummer is.
export function toE164NL(raw: string): string | null {
  let s = (raw || "").replace(/[\s\-().]/g, "");
  if (s.startsWith("+")) {
    // al internationaal
  } else if (s.startsWith("0031")) {
    s = "+" + s.slice(2);
  } else if (s.startsWith("31") && s.length >= 11) {
    s = "+" + s;
  } else if (s.startsWith("0")) {
    s = "+31" + s.slice(1);
  } else {
    s = "+31" + s;
  }
  s = "+" + s.slice(1).replace(/\D/g, "");
  return /^\+316\d{8}$/.test(s) ? s : null;
}

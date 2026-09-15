// Bepaalt of een creator het bereik/de statistieken al mag doorgeven. Dat kan
// pas 48 uur nadat de content is geplaatst: eerst content, daarna het bereik
// meten. We rekenen vanaf het moment van de content-upload (contentPostedAt).

const UREN_48 = 48 * 60 * 60 * 1000;

export function reachBeschikbaar(
  contentPosted?: boolean,
  contentPostedAtSec?: number,
  now: number = Date.now()
): boolean {
  if (!contentPosted) return false; // eerst content plaatsen
  if (!contentPostedAtSec) return true; // oude deals zonder tijdstip -> niet blokkeren
  return now >= contentPostedAtSec * 1000 + UREN_48;
}

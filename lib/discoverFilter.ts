// Pure filter-logica voor Ontdek. Los van React/Firebase zodat het testbaar is.

export type RestaurantFilter = {
  q?: string;
  stad?: string;
  keuken?: string;
  prijs?: string;
  metDeals?: boolean;
};

type FilterRow = {
  id: string;
  naam?: string;
  keuken?: string;
  prijs?: string;
  adres?: string;
};
type DealRef = { owner: string; status: string };

export function heeftOpenDeal(restaurantId: string, deals: DealRef[]): boolean {
  return deals.some((d) => d.owner === restaurantId && d.status === "open");
}

export function matchtRestaurant(r: FilterRow, f: RestaurantFilter, deals: DealRef[]): boolean {
  const qq = (f.q ?? "").trim().toLowerCase();
  const ss = (f.stad ?? "").trim().toLowerCase();
  const okQ = !qq || `${r.naam ?? ""} ${r.keuken ?? ""}`.toLowerCase().includes(qq);
  const okStad = !ss || `${r.adres ?? ""}`.toLowerCase().includes(ss) || !r.adres;
  const okKeuken = !f.keuken || r.keuken === f.keuken;
  const okPrijs = !f.prijs || r.prijs === f.prijs;
  const okDeals = !f.metDeals || heeftOpenDeal(r.id, deals);
  return okQ && okStad && okKeuken && okPrijs && okDeals;
}

export function filterRestaurants<T extends FilterRow>(
  rows: T[],
  f: RestaurantFilter,
  deals: DealRef[]
): T[] {
  return rows.filter((r) => matchtRestaurant(r, f, deals));
}

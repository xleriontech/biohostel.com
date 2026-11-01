import { store } from "./store";
import type { StoredListing } from "./store";

export async function commissionRateFor(): Promise<(listing: StoredListing) => number> {
  const [users, config] = await Promise.all([
    store.users(),
    store.config().catch(() => null),
  ]);
  const rates = config?.rates ?? { gratuito: 0.1, corporativo: 0.05, premium: 0 };
  return (listing) => {
    const plan =
      listing.ownerId === "demo"
        ? listing.anfitrion.plan
        : users.find((u) => u.id === listing.ownerId)?.plan ?? "gratuito";
    return rates[plan] ?? 0.1;
  };
}

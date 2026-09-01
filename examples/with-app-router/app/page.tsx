import { DayaNextConfigError } from "@okeke-dev/daya-next/server";

import { getDaya } from "@/lib/daya";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let rate;
  try {
    const daya = await getDaya();
    const { rate: current } = await daya.rates.get({ from: "NGN", to: "USDC", side: "BUY" });
    rate = current;
  } catch (error) {
    if (error instanceof DayaNextConfigError) {
      return (
        <main>
          <h1>Daya client config error</h1>
          <p>{error.message}</p>
          <p>Add DAYA_API_KEY to your environment and restart the dev server.</p>
        </main>
      );
    }
    throw error;
  }

  return (
    <main>
      <h1>NGN/USDC rate</h1>
      <p>
        {rate.base_currency} → {rate.quote_currency}: {rate.value}
      </p>
      <p>
        Webhook endpoint: <code>POST /api/webhooks/daya</code>
      </p>
      <p>
        <a href="/customers/new">Create a customer (Server Action)</a>
      </p>
    </main>
  );
}

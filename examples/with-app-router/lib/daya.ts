import { createDayaCachedClient } from "@okeke-dev/daya-next";

// One client per request: every Server Component / Server Action that calls
// `getDaya()` in the same render shares the same memoized client.
export const getDaya = createDayaCachedClient;

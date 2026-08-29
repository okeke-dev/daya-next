import { getDayaClient } from "@okeke-dev/daya-next/server";
import { cache } from "react";

export const getDaya = cache(() => getDayaClient());

import { initTRPC } from "@trpc/server";
import { Context } from "./context.ts";

export const t = initTRPC.context<Context>().create();

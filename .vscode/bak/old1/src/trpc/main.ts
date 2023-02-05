import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { t } from "./trpc.ts";
import type { AppEnv } from "../types.ts";
import { createContext } from "./context.ts";
import { sql } from "kysely";

export const trpcAppRootRouter = t.router({
  hello: t.procedure.query(async ({ ctx }) => {
    const { rows } = await sql`select 7+3 as sum`.execute(ctx.env.db);
    return {
      data: rows[0],
      isHttpCall: ctx.isHttpCall,
      msg: "Hello World",
    };
  }),
});

export type TRPCAppRootRouter = typeof trpcAppRootRouter;

export async function createCaller(env: AppEnv["Bindings"]) {
  const context = await createContext(env);
  const caller = trpcAppRootRouter.createCaller(context);
  return caller;
}

export function createHttpCaller(req: Request, env: AppEnv["Bindings"]) {
  return fetchRequestHandler({
    router: trpcAppRootRouter,
    endpoint: "/trpc",
    createContext: ({ req }) => createContext({ req, ...env }),
    batching: {
      enabled: false,
    },
    req,
  });
}

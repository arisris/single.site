import { t } from "../trpc.ts";
import { authRouter } from "./auth.ts";

export const appRouter = t.router({
  hello: t.procedure.query(async ({ ctx }) => {
    return {
      ok: true,
    };
  }),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;

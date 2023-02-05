import { initTRPC } from "https://esm.sh/@trpc/server@10.9.0";
import { fetchRequestHandler } from "https://esm.sh/@trpc/server@10.9.0/adapters/fetch";
import { Handler } from "https://deno.land/x/hono@v2.5.10/types.ts";
import { Bindings, sql } from "./system.ts";
import { z } from "https://deno.land/x/zod@v3.20.0/mod.ts";

type Context = Bindings;
const t = initTRPC.context<Context>().create();

export const accountRouter = t.router({
  me: t.procedure.query(async ({ ctx }) => {
    const result = await ctx.db.withSchema("blog_app")
      .selectFrom("users")
      .innerJoin("sites", (join) => join.onRef("sites.id", "=", "users.id"))
      .select([
        "users.id",
        "users.user_login",
        "users.user_email",
        sql`json_agg(json_build_object('id', sites.id, 'site_name', sites.site_name))`
          .as("sites"),
      ])
      .where("users.id", "=", 1)
      .limit(1)
      .groupBy("users.id")
      .executeTakeFirst();
    return result;
  }),
  login: t.procedure.input(z.object({
    login: z.string().min(1),
    password: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.withSchema("blog_app")
      .selectFrom("users")
      .where("user_email", "=", input.login)
      .orWhere("user_login", "=", input.login)
      .select(["id", "user_email", "user_login", "user_password"])
      .limit(1)
      .executeTakeFirstOrThrow();
    if (!user.user_password) throw new Error("Password not set");
    return user;
  }),
});

export const rootRouter = t.router({
  "hello": t.procedure.query(async ({ ctx }) => {
    const result = await ctx.db.withSchema("blog_app")
      .selectFrom(sql`(select 1+1 as sum)`.as("sum"))
      .select(["sum"])
      .executeTakeFirst();
    return {
      sum: result?.sum,
    };
  }),
  account: accountRouter,
});

export type TRPCAppRouter = typeof rootRouter;

export const apiCaller = (c: Context) => rootRouter.createCaller(c);

export const httpHandler: Handler<"/api/*", { Bindings: Bindings }> = async (
  c,
) => {
  const result = await fetchRequestHandler({
    router: rootRouter,
    endpoint: "/api",
    req: c.req as Request,
    createContext: () => ({ ...c.env, hello: "Hello World" }),
    batching: { enabled: false },
  });
  return result;
};

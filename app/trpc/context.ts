// deno-lint-ignore-file
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { type inferAsyncReturnType } from "@trpc/server";
import { AppEnv } from "../types.ts";

export interface ContextInner {
  isHttpCall: boolean;
  req?: Request;
  env: AppEnv["Bindings"];
}

export async function createContextInner(ci: ContextInner) {
  return {
    ...ci,
  };
}

export async function createContext(
  { req, ...env }: AppEnv["Bindings"] & { req?: Request },
) {
  const isHttpCall = typeof req !== "undefined";

  return createContextInner({
    req,
    isHttpCall,
    env,
  });
}

export type Context = inferAsyncReturnType<typeof createContext>;

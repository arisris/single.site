// deno-lint-ignore-file
import { inferAsyncReturnType } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

interface InnerContext {
  user?: string;
}

export async function createContextInner(_opts: InnerContext) {
  return {};
}

export async function createContext({ req }: FetchCreateContextFnOptions) {
  return createContextInner({});
}

export type Context = inferAsyncReturnType<typeof createContext>;

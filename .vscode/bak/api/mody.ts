// Api module
import {
  type FetchHandlerRequestOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import { restApiRequestHandler } from "./adapter/rest.ts";
import { type Context, createContext } from "./context.ts";
import { type AppRouter, appRouter } from "./routers/_app.ts";

interface Options {
  endpoint: string;
}

export type { AppRouter, Context };

export async function createApiHandler(req: Request, { endpoint }: Options) {
  const { pathname, searchParams } = new URL(req.url);

  const options: FetchHandlerRequestOptions<AppRouter> = {
    router: appRouter,
    endpoint,
    req,
    createContext,
  };
  
  const rpcEndpoint = `${endpoint}/trpc`;
  let response: Response;
  if (pathname.startsWith(rpcEndpoint)) {
    response = await fetchRequestHandler({
      ...options,
      endpoint: rpcEndpoint,
    });
  } else {
    response = await restApiRequestHandler({
      ...options,
      batching: { enabled: false },
    });
  }
  if (searchParams.has("_pretty")) {
    return new Response(
      JSON.stringify(await response.json(), undefined, 2),
      response,
    );
  }
  return response;
}

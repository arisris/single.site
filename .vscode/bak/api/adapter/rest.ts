// deno-lint-ignore-file no-explicit-any
import { AnyRouter } from "@trpc/server";
import { type FetchHandlerRequestOptions } from "@trpc/server/adapters/fetch";
import { resolveHTTPResponse } from "@trpc/server/dist/http/index.js";

export async function restApiRequestHandler<TRouter extends AnyRouter>(
  opts: FetchHandlerRequestOptions<TRouter>,
) {
  // deno-lint-ignore require-await
  const createContext = async () => {
    return opts.createContext?.({ req: opts.req });
  };
  const url = new URL(opts.req.url);
  const path = url.pathname.slice(opts.endpoint.length + 1);
  const query = new URLSearchParams();
  const params: Record<any, any> = {};
  url.searchParams.forEach((val, key) => {
    params[key] = val;
  });
  query.set(
    "input",
    JSON.stringify(params),
  );
  const headers: Record<any, any> = {};
  opts.req.headers.forEach((val, key) => {
    headers[key] = val;
  });
  const req = {
    query,
    headers,
    method: opts.req.method,
    body: await opts.req.text(),
  };
  const result = await resolveHTTPResponse({
    req,
    path,
    router: opts.router,
    batching: { enabled: false },
    createContext,
    responseMeta: opts.responseMeta,
    onError(o) {
      opts?.onError?.({ ...o, req: opts.req });
    },
  });
  let output: any;
  try {
    const json = JSON.parse(result.body!);
    if (json?.result?.data) {
      output = JSON.stringify({
        ...json.result?.data,
      });
    } else {
      let errors: any;
      try {
        errors = JSON.parse(json.error.message);
        // deno-lint-ignore no-unused-vars
      } catch (e) {
        errors = json.error.message;
      }
      output = JSON.stringify({
        code: json.error.data.code,
        errors,
      });
    }
    // deno-lint-ignore no-unused-vars
  } catch (e) {
    // do nothing
  }
  const res = new Response(output, {
    status: result.status,
  });

  for (const [key, value] of Object.entries(result.headers ?? {})) {
    /* istanbul ignore if  */
    if (typeof value === "undefined") {
      continue;
    }

    if (typeof value === "string") {
      res.headers.set(key, value);
      continue;
    }

    for (const v of value) {
      res.headers.append(key, v);
    }
  }
  return res;
}

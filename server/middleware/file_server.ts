import { type MiddlewareHandler } from "hono/mod.ts";
import { serveFile } from "std/http/file_server.ts";
import { fromFileUrl, join } from "std/path/mod.ts";

interface Options {
  rootUrl: URL;
  basePath: string;
}

export function fileServer(
  { basePath, rootUrl }: Options,
): MiddlewareHandler {
  const root = fromFileUrl(rootUrl);
  return async (c, next) => {
    const requestedPath = new URL(c.req.url).pathname;
    if (!requestedPath.startsWith(basePath)) {
      return next();
    }
    const filePath = join(root, requestedPath.slice(basePath.length));
    const response = await serveFile(c.req as unknown as Request, filePath, {
      etagAlgorithm: "FNV64",
    });
    c.res = response;
    return c.res;
  };
}

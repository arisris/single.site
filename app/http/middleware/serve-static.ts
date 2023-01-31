import { MiddlewareHandler } from "hono/mod.ts";
import { getMimeType } from "hono/utils/mime.ts";
import { fromFileUrl, join } from "std/path/mod.ts";

interface Options {
  rootUrl: URL;
  basePath?: string;
  weak?: boolean;
}

export const serveStatic = (opts: Options): MiddlewareHandler => {
  const root = fromFileUrl(opts.rootUrl);
  return async (c, next) => {
    if (!opts.basePath) {
      opts.basePath = "/";
    }
    const requestedPath = new URL(c.req.url).pathname;
    if (!requestedPath.startsWith(opts.basePath)) {
      return next();
    }
    const fileUrl = join(root, requestedPath.slice(opts.basePath.length));
    let file: Deno.FsFile | undefined;
    try {
      file = await Deno.open(fileUrl, { read: true, write: false });
      const fileStat = await file.stat();
      if (!fileStat.isFile) return next();
      const etag = stattag(fileStat);
      c.header("access-control-allow-origin", "*");
      c.header(
        "content-type",
        getMimeType(fileUrl) ?? "application/octet-stream",
      );
      c.header("cache-control", "public, max-age=31536000");
      c.header("etag", opts.weak ? "W/" + etag : etag);
      c.header("vary", "If-None-Match");
      if (fileStat.mtime) {
        c.header("last-modified", fileStat.mtime.toUTCString());
      }
      c.header("content-encoding", "gzip");
      const ifNoneMatch = c.req.headers.get("if-none-match");
      if (ifNoneMatch === etag || ifNoneMatch === "W/" + etag) {
        return c.newResponse(null, 304);
      }
      const fileContent = file.readable.pipeThrough(
        new CompressionStream("gzip"),
      );
      // c.header("content-length", String(fileStat.size));
      return c.newResponse(fileContent, 200);
    } catch (_e) {
      // do nothing
    }
    await next();
  };
};

function stattag(stat: Deno.FileInfo) {
  const mtime = stat.mtime?.getTime().toString(16);
  const size = stat.size.toString(16);
  return `"${size}-${mtime}"`;
}

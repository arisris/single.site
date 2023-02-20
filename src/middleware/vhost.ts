import { type MiddlewareHandler } from "hono/mod.ts";

export default function vhost(): MiddlewareHandler {
  return async (_c, next) => {
    // todo
    await next();
  };
}

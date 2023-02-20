import { type MiddlewareHandler } from "hono/mod.ts";

export default function vhost(): MiddlewareHandler {
  return async (c, next) => {
    await next();
  };
}

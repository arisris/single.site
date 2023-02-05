// deno-lint-ignore-file
import { Context } from "hono/mod.ts";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { AppEnv } from "../../types.ts";

export interface RenderOptions {
  context: Context<"/*", AppEnv>;
}
export async function render(
  node: React.ReactNode,
  { context }: RenderOptions,
) {
  const stream = await ReactDOMServer.renderToReadableStream(node);
  return context.body(stream);
}

export function Head() {
  
}
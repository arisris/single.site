import { html, jsx, JSXNode } from "hono/middleware.ts";

export { html, jsx };
export type JSXChild = string | number | JSXNode | JSXChild[];

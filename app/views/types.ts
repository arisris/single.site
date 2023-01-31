import { JSXNode } from "hono/middleware.ts";
export type JSXChild = string | number | JSXNode | JSXChild[];

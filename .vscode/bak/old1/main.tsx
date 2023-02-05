/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "std/dotenv/load.ts";
import { bootServer } from "./src/server.ts";

if (import.meta.main) {
  addEventListener("unload", bootServer());
}

export { bootServer };

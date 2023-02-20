import "std/dotenv/load.ts";
import { start } from "$/mod.ts";
import twindConfig from "./twind.config.ts";

const unload = start({
  entryPoint: import.meta.url,
  twindConfig,
});

addEventListener("unload", unload);

import "std/dotenv/load.ts";
import { start } from "./server/mod.ts";
import twindConfig from "./twind.config.ts";

const unload = start({
  entryPoint: import.meta.url,
  twindConfig,
  // secure: {
  //   certFile: "./resources/certs/kodok.localhost+1.pem",
  //   keyFile: "./resources/certs/kodok.localhost+1-key.pem"
  // }
});

addEventListener("unload", unload);

import "std/dotenv/load.ts";
import { bootServer } from "./app/server.tsx";

addEventListener("unload", bootServer());

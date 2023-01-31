// deno-lint-ignore-file no-explicit-any
import { ConnInfo } from "std/http/server.ts";
import { Kysely } from "kysely";
import { ValidEnv } from "./utils/env.ts";

export type AppDB = Kysely<Record<string, any>>;

export type AppEnv = {
  Bindings: ConnInfo & {
    validEnv: ValidEnv;
    db: AppDB;
  };
  Variables: Record<string, any>;
};

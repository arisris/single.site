import { Kysely } from "kysely";
import { ValidEnv } from "./utils/env.ts";
// deno-lint-ignore no-explicit-any
export type AnyRecord = Record<string, any>;

export type AppDB = Kysely<AnyRecord>;

export type AppEnv = {
  Bindings: {
    readonly validEnv: ValidEnv;
    db: AppDB;
  };
  Variables: AnyRecord;
};

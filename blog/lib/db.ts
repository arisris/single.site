// deno-lint-ignore-file
import { createKyPg, sql } from "./kypg.ts";
export { sql };
export enum Roles {
  user,
  admin,
  moderator,
}

type AnyRecord = Record<string, any>;

export function initDB(dsn: string, enableLog = true) {
  const db = createKyPg<AnyRecord>(dsn, {
    log: enableLog ? ["query", "error"] : undefined,
  });
  return db;
}

export type KyDB = ReturnType<typeof initDB>;

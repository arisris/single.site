import { Pool, PoolClient } from "postgres/mod.ts";
import { QueryObjectResult } from "postgres/query/query.ts";

export class Database {
  static #instance: Database | undefined;
  private constructor(protected pool: Pool) {}

  async query<T>() {
    let poolClient: PoolClient | undefined
    try {
      poolClient = await this.pool.connect();
      return poolClient.queryObject;
    } catch (e) {
      throw e;
    } finally {
      poolClient?.release();
    }
  }

  static init(dsn: string) {
    if (globalThis.__pool) throw new Error("Pool has been initialized.");
    if (!globalThis.__pool) {
      globalThis.__pool = new Pool(dsn, 3, true);
    }
    if (!this.#instance) {
      this.#instance = new Database(globalThis.__pool);
    }
    return this.#instance;
  }
}

declare const globalThis: { __pool: Pool | undefined };

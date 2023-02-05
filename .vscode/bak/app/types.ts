import { Kysely } from "kysely";
import { ValidEnv } from "./utils/env.ts";
import { JSXNode } from "hono/middleware.ts";

declare module "hono/mod.ts" {
  export class Context {
    render(): void;
  }
}

// deno-lint-ignore no-explicit-any
export type AnyRecord = Record<string, any>;

/**
 * Kysely DB Instance
 */
export type AppDB = Kysely<AnyRecord>;

/**
 * AppEnv Bindings & Variables
 */
export type AppEnv = {
  Bindings: {
    /**
     * A Valid environtment variables
     * also can be directly import from "./utils/env.ts"
     */
    readonly validEnv: ValidEnv;
    /**
     * Database
     */
    db: AppDB;
  };
  /**
   * Useful setter/getter variables
   */
  Variables: AnyRecord;
};

export type JSXChild = string | number | JSXNode | JSXChild[];

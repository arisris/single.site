// deno-lint-ignore-file
import { serve } from "std/http/server.ts";
import { Hono } from "hono/mod.ts";
import { z } from "zod";

export interface KodokDatabaseConfig {
  driver: "postgres", // postgres currently
}
export interface KodokConfig {
  mode: "development" | "production",
  session: Record<string, string>,
  database: any
}

export class KodokSystem {
  #app: Hono;
  constructor() {
    this.#app = new Hono();
  }
  start() {
    return () => {
      // destroy system
    };
  }
}

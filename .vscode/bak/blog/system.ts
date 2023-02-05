import { Hono } from "https://deno.land/x/hono@v2.5.10/hono.ts";
import { z } from "https://deno.land/x/zod@v3.20.0/mod.ts";
import { parse as parseFlags } from "https://deno.land/std@0.171.0/flags/mod.ts";
import { Environment } from "https://deno.land/x/hono@v2.5.10/types.ts";
import { serve } from "https://deno.land/std@0.171.0/http/server.ts";
import {
  CompiledQuery,
  Kysely,
  //Migrator,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  sql,
} from "https://cdn.jsdelivr.net/npm/kysely/dist/esm/index.js";
import type {
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  KyselyPlugin,
  LogConfig,
  Migration,
  MigrationProvider,
  QueryCompiler,
  QueryResult,
  TransactionSettings,
} from "https://cdn.jsdelivr.net/npm/kysely/dist/esm/index.js";
import {
  Pool as PGPool,
  PoolClient as PGPoolClient,
} from "https://deno.land/x/postgres@v0.17.0/mod.ts";

export { sql };

// function createKyPgMigrator<TDB = unknown>(
//   db: Kysely<TDB>,
//   migrationFolder: URL,
// ) {
//   return new Migrator({
//     db,
//     provider: new DenoFileMigrationProvider(migrationFolder),
//   });
// }

function createKyPg<TDB = unknown>(
  connectionString: string,
  opts?: {
    poolSize?: number;
    log?: LogConfig;
    plugins?: KyselyPlugin[];
  },
) {
  return new Kysely<TDB>({
    dialect: new DenoProstgresDialect<TDB>({
      pool: new PGPool(connectionString, opts?.poolSize || 2),
    }),
    plugins: opts?.plugins,
    log: opts?.log,
  });
}

const PRIVATE_RELEASE_METHOD = Symbol();

interface DenoProstgresDialectConfig {
  pool: PGPool | (() => PGPool | Promise<PGPool>);
}

class DenoProstgresDialect<TDB = unknown> implements Dialect {
  constructor(private config: DenoProstgresDialectConfig) {}
  createDriver(): Driver {
    return new DenoPostgresDriver(this.config);
  }
  createQueryCompiler(): QueryCompiler {
    return new PostgresQueryCompiler();
  }
  createAdapter(): DialectAdapter {
    return new PostgresAdapter();
  }
  createIntrospector(db: Kysely<TDB>): DatabaseIntrospector {
    return new PostgresIntrospector(db);
  }
}

class DenoPostgresDriver implements Driver {
  #pool?: PGPool;
  #connections?: WeakMap<PGPoolClient, DenoPostgresDatabaseConnection>;

  constructor(private config: DenoProstgresDialectConfig) {}
  async init(): Promise<void> {
    this.#pool = typeof this.config.pool === "function"
      ? await this.config.pool()
      : this.config.pool;
  }
  async acquireConnection(): Promise<DenoPostgresDatabaseConnection> {
    const client = await this.#pool!.connect();
    let connection = this.#connections?.get(client);
    if (!connection) {
      connection = new DenoPostgresDatabaseConnection(client);
      this.#connections?.set(client, connection);
    }
    return connection;
  }
  async beginTransaction(
    connection: DenoPostgresDatabaseConnection,
    _settings: TransactionSettings,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("begin"));
  }
  async commitTransaction(
    connection: DenoPostgresDatabaseConnection,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }
  async rollbackTransaction(
    connection: DenoPostgresDatabaseConnection,
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }
  // deno-lint-ignore require-await
  async releaseConnection(
    connection: DenoPostgresDatabaseConnection,
  ): Promise<void> {
    connection[PRIVATE_RELEASE_METHOD]();
  }
  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool;
      this.#pool = undefined;
      await pool.end();
    }
  }
}

class DenoPostgresDatabaseConnection implements DatabaseConnection {
  constructor(private poolCLient: PGPoolClient) {}
  async executeQuery<R>(
    compiledQuery: CompiledQuery,
  ): Promise<QueryResult<R>> {
    try {
      await this.poolCLient.connect();
      const query = await this.poolCLient.queryObject<R>(
        compiledQuery.sql,
        compiledQuery.parameters as unknown[],
      );
      if (
        query.command === "INSERT" || query.command === "UPDATE" ||
        query.command === "DELETE"
      ) {
        const numAffectedRows = BigInt(query.rowCount || 0);
        return { rows: query.rows, insertId: numAffectedRows };
      }
      return { rows: query.rows };
    } catch (e) {
      throw e;
    }
  }
  streamQuery<R>(
    _compiledQuery: CompiledQuery,
    _chunkSize?: number | undefined,
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Unsupported.");
  }
  [PRIVATE_RELEASE_METHOD](): void {
    this.poolCLient.release();
  }
}

// deno-lint-ignore no-unused-vars
class DenoFileMigrationProvider implements MigrationProvider {
  constructor(private url: URL) {
    if (!url.href.endsWith("/")) {
      this.url = new URL(`${url.href}/`);
    }
  }
  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    for await (const file of Deno.readDir(this.url)) {
      if (
        file.isFile && file.name.endsWith(".js") ||
        (file.name.endsWith(".ts") && !file.name.endsWith(".d.ts")) ||
        file.name.endsWith(".mjs") ||
        (file.name.endsWith(".mts") && !file.name.endsWith(".d.mts"))
      ) {
        const migration = await import(
          new URL(file.name, this.url).href
        );
        const migrationKey = file.name.substring(0, file.name.lastIndexOf("."));

        // Handle esModuleInterop export's `default` prop...
        if (isMigration(migration?.default)) {
          migrations[migrationKey] = migration.default;
        } else if (isMigration(migration)) {
          migrations[migrationKey] = migration;
        }
      }
    }
    return migrations;
  }
}

function isMigration(obj: unknown): obj is Migration {
  return typeof obj === "object" || typeof obj === "function";
}

export enum Roles {
  user,
  admin,
  moderator,
}

// deno-lint-ignore no-explicit-any
export type AnyRecord = Record<string, any>;

export function initDB(dsn: string, enableLog = true) {
  const db = createKyPg<AnyRecord>(dsn, {
    log: enableLog ? ["query", "error"] : undefined,
  });
  return db;
}

export type KyDB = ReturnType<typeof initDB>;

const HMR_SCRIPT =
  `let socket,reconnectTimer;const wsOrigin=window.location.origin.replace("http","ws").replace("https","wss"),socketUrl=wsOrigin+"/_hmr";hmrSocket();function hmrSocket(callback){if(socket){socket.close();}socket=new WebSocket(socketUrl);socket.addEventListener("open",()=>{console.log("HMR Connected");},{once: true});socket.addEventListener("open",callback);socket.addEventListener("message",(event)=>{if(event.data==="refresh"){console.log("refreshings");window.location.reload();}});socket.addEventListener("close",()=>{console.log("reconnecting...");clearTimeout(reconnectTimer);reconnectTimer=setTimeout(()=>{hmrSocket(()=>{window.location.reload();});},1000);});}`;
const SOCKETS = new Set<WebSocket>();

let kydb: KyDB;
const schema = z.object({
  mode: z.enum(["development", "staging", "production"]).default(
    "development",
  ),
  db: z.string().url().superRefine((arg, ctx) => {
    if (!arg.startsWith("postgres")) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid dsn: Currently we only support postgres database",
      });
    }
  }).transform((urlString) => {
    kydb = initDB(urlString);
    return kydb;
  }),
  secret: z.string().min(32),
  port: z.string().min(2).max(4).transform((s) => {
    let port = parseInt(s);
    if (isNaN(port)) {
      port = 8000;
    }
    return port;
  }),
});

export type Bindings = Readonly<z.infer<typeof schema>>;

export async function start<T extends Partial<Environment>>(
  app: Hono<T>,
  signal?: AbortSignal,
) {
  const ENV: Bindings = Object.seal(
    await schema.parseAsync(parseFlags(Deno.args, {
      boolean: ["install"],
      string: ["port", "db", "secret", "mode"],
      default: {
        db: Deno.env.get("DATABASE_URL"),
        secret: Deno.env.get("APP_KEY"),
        port: "8000",
        mode: Deno.env.get("DENO_DEPLOYMENT_ID")
          ? "production"
          : Deno.env.get("DENO_ENV"),
      },
    })),
  );

  const reload = async () => {
    await kydb.destroy();
    SOCKETS.forEach((s) => {
      s.send("refresh");
    });
  };
  if (signal) {
    signal?.addEventListener("abort", reload);
  } else {
    globalThis.addEventListener("unload", reload);
  }
  serve((req: Request) => {
    const url = new URL(req.url);
    // serve hmr
    if (ENV.mode !== "production" && url.pathname === "/_hmr") {
      if (req.headers.get("upgrade") == "websocket") {
        const { response, socket } = Deno.upgradeWebSocket(req);
        SOCKETS.add(socket);
        socket.onclose = () => {
          SOCKETS.delete(socket);
        };
        return response;
      } else {
        return new Response(HMR_SCRIPT, {
          status: 200,
          headers: {
            "content-type": "application/javascript; charset=utf-8;",
            "cache-control": "private, max-age=0, must-revalidate",
          },
        });
      }
    }
    return app.fetch(req, ENV);
  }, { signal, port: ENV.port });

  // let watcher: Deno.FsWatcher | undefined;
  // if (ENV.mode !== "production") {
  //   watcher = Deno.watchFs(new URL("./public", import.meta.url).pathname, {
  //     recursive: true,
  //   });

  //   (async () => {
  //     for await (const ev of watcher) {
  //       if (ev.kind === "modify" || ev.kind === "create") {
  //         RELOAD();
  //       }
  //     }
  //   })();
  // }
}

import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  Kysely,
  KyselyPlugin,
  LogConfig,
  Migration,
  MigrationProvider,
  Migrator,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  QueryCompiler,
  QueryResult,
  sql,
  TransactionSettings,
} from "https://cdn.jsdelivr.net/npm/kysely/dist/esm/index.js";
import { Pool, PoolClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

export { sql };

export function createKyPgMigrator<TDB = unknown>(
  db: Kysely<TDB>,
  migrationFolder: URL,
) {
  return new Migrator({
    db,
    provider: new DenoFileMigrationProvider(migrationFolder),
  });
}

export function createKyPg<TDB = unknown>(
  connectionString: string,
  opts?: {
    poolSize?: number;
    log?: LogConfig;
    plugins?: KyselyPlugin[];
  },
) {
  return new Kysely<TDB>({
    dialect: new DenoProstgresDialect<TDB>({
      pool: new Pool(connectionString, opts?.poolSize || 2),
    }),
    plugins: opts?.plugins,
    log: opts?.log,
  });
}

const PRIVATE_RELEASE_METHOD = Symbol();

interface DenoProstgresDialectConfig {
  pool: Pool | (() => Pool | Promise<Pool>);
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
  #pool?: Pool;
  #connections?: WeakMap<PoolClient, DenoPostgresDatabaseConnection>;

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
  constructor(private poolCLient: PoolClient) {}
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

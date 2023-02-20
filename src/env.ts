import { type ConnInfo } from "std/http/server.ts";
import { parse } from "std/flags/mod.ts";
import { z } from "zod";

// deno-lint-ignore no-explicit-any
type AnyRecord = Record<string, any>;

export const envSchema = z.object({
  DENO_ENV: z.enum(["development", "staging", "production"]).default(
    "development",
  ),
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  APP_KEY: z.string().min(32),
  APP_PORT: z.number().min(2).default(8000),
}).superRefine((arg, ctx) => {
  if (!arg.DATABASE_URL.startsWith("postgres")) {
    ctx.addIssue({
      code: "custom",
      message: "Currently we only support postgres database",
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export type Bindings = {
  readonly env: Env;
  readonly entryPoint: string;
  readonly connInfo: ConnInfo;
};
export type AppEnv<B = AnyRecord, V = AnyRecord> = {
  Bindings: Bindings & B;
  Variables: V;
};

// env from cli flags is first they can override default env values
export function getValidEnv() {
  const flags = parse(Deno.args, {
    boolean: ["release"],
    string: ["port", "db", "key"],
  });

  const env = Deno.env.toObject() as AnyRecord;

  // release flags or on deno deploy
  if (flags.release || !!Deno.env.get("DENO_DEPLOYMENT_ID")) {
    env["DENO_ENV"] = "production";
  }
  if (flags.db) {
    env["DATABASE_URL"] = flags.db;
  }
  if (flags.key) {
    env["APP_KEY"] = flags.key;
  }
  if (flags.port) {
    env["APP_PORT"] = parseInt(flags.port);
  }
  const result = envSchema.parse(env);
  return result;
}

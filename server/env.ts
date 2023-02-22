import { type ConnInfo } from "std/http/server.ts";
import { parse } from "std/flags/mod.ts";
import { z } from "zod";

// deno-lint-ignore no-explicit-any
type AnyRecord = Record<string, any>;

// environtment variable schema
export const envSchema = z.object({
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  REDIS_URL: z.string().url("Invalid REDIS_URL"),
  MINIO_URL: z.string().url("Invalid MINIO_URL"),
  CADDY_ADMIN_URL: z.string().url("Invalid CADDY_ADMIN_URL"),
  APP_KEY: z.string().min(32),
  APP_PORT: z.number().min(2).default(3000),
  APP_DOMAIN: z.string().min(2),
  APP_DOMAINS: z.string().min(2).transform((i) => i.split(",")),
  DENO_ENV: z.enum(["development", "staging", "production"]).default(
    "development",
  ),
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
    string: ["port", "key"],
  });

  const env = Deno.env.toObject() as AnyRecord;

  // release flags or on deno deploy
  if (flags.release || !!Deno.env.get("DENO_DEPLOYMENT_ID")) {
    env["DENO_ENV"] = "production";
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

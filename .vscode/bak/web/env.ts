import { z } from "zod";
import { parse } from "std/flags/mod.ts";

type AnyRecord = Record<string, unknown>;

const envSchema = z.object({
  DENO_ENV: z.enum(["development", "staging", "production"]).default(
    "development",
  ),
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  APP_SECRET: z.string().min(32),
  APP_PORT: z.number().min(2).default(8000),
}).superRefine((arg, ctx) => {
  if (!arg.DATABASE_URL.startsWith("postgres")) {
    ctx.addIssue({
      code: "custom",
      message: "Currently we only support postgres database",
    });
  }
});

export type EnvSchema = z.infer<typeof envSchema>;

export type AppEnv<
  B extends AnyRecord = AnyRecord,
  V extends AnyRecord = AnyRecord,
> = {
  Bindings: EnvSchema & B;
  Variables: V;
};

// env from cli flags is first they can override default env values
export async function getValidEnv() {
  const flags = parse(Deno.args, {
    boolean: ["release"],
    string: ["port", "db", "secret"],
  });

  const env = Deno.env.toObject() as unknown as EnvSchema;

  // release flags or on deno deploy
  if (flags.release || !!Deno.env.get("DENO_DEPLOYMENT_ID")) {
    env["DENO_ENV"] = "production";
  }
  if (flags.db) {
    env["DATABASE_URL"] = flags.db;
  }
  if (flags.secret) {
    env["APP_SECRET"] = flags.secret;
  }
  if (flags.port) {
    env["APP_PORT"] = parseInt(flags.port);
  }
  const result = await envSchema.parseAsync(env);
  return result;
}

import { z } from "zod";

export function getValidEnv() {
  const result = z.object({
    APP_KEY: z.string().default("nokey"),
    DENO_ENV: z.enum(["development", "test", "staging", "production"]).default(
      "development",
    ),
    DATABASE_URL: z.string().url().superRefine((arg, ctx) => {
      if (!arg.startsWith("postgres")) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid dsn: Currently we only support postgres database",
        });
      }
    }),
  }).parse(Deno.env.toObject());
  return Object.seal(result) as Readonly<typeof result>;
}

export type ValidEnv = ReturnType<typeof getValidEnv>;

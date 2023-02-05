// deno-lint-ignore-file no-unused-vars require-await
import { t } from "../trpc.ts";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { compare } from "bcrypt";

export const authRouter = t.router({
  me: t.procedure
    .query(() => {
      return { ok: true };
    }),
  signinToken: t.procedure
    .input(z.object({
      token: z.string().min(32),
    }))
    .query(({ ctx, input }) => {
      // check the token
      return { ok: true };
    }),
  signin: t.procedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
    }),
  signup: t.procedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return { ok: true };
    }),
  resetPassword: t.procedure
    .input(z.object({
      code: z.string(),
    }))
    .query(() => {
      return { ok: true };
    }),
  requestPasswordReset: t.procedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(() => {
      return { msg: "Please check your email" };
    }),
});

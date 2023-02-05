// deno-lint-ignore-files
import { Context } from "hono/mod.ts";
import { Jwt } from "hono/utils/jwt/index.ts";
import { AlgorithmTypes } from "hono/utils/jwt/types.ts";
import { CookieOptions } from "hono/utils/cookie.ts";
import ms from "ms";

type Primitive = string | boolean | number | bigint | null;
type Primitives = Primitive | Record<string, Primitive> | Primitive[];
type PrimitivesRecord = Record<string, Primitives>;

type JWTSession = {
  flash<V extends Primitives | undefined>(
    key: string,
    value?: V,
  ): V extends undefined ? void : V;
  commit(): Promise<void>;
} & { [x: string]: Primitives };

type CookieOpts = Omit<CookieOptions, "maxAge" | "expires">;
interface Options {
  secret?: string;
  maxAge?: string | number;
  cookieName?: string;
  cookieOptions?: CookieOpts;
}

export function jwtSession(options?: Options) {
  const maxAge = options?.maxAge
    ? ms(
      typeof options.maxAge === "number" ? ms(options.maxAge) : options.maxAge,
    )
    : ms("1 hours");
  const cookieName = options?.cookieName ?? "ss_jwt_session";
  const cookieOptions: CookieOpts = {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    ...(options?.cookieOptions ?? {}),
  };
  const secret = options?.secret ?? "not_secured_no_secret_key_are_provided";
  const parseJwt = async (raw?: string) => {
    if (!raw) return undefined;
    try {
      const isValid = await Jwt.verify(raw, secret, AlgorithmTypes.HS512);

      if (isValid) {
        return Jwt.decode(raw).payload;
      }
    } catch (_e) {
      // do nothing
    }
    return undefined;
  };
  const proxy = (context: Context, cookie: PrimitivesRecord) => {
    const prefix = "__flash_",
      flash = (key: string, value?: Primitives) => {
        if (typeof value === "undefined") {
          const flashValue = cookie[prefix + key];
          delete cookie[prefix + key];
          return flashValue;
        }
        cookie[prefix + key] = value;
        return;
      },
      getToken = async () => {
        const iat = Date.now(),
          exp = Math.floor(iat + (maxAge / 1000));
        const value = await Jwt.sign(
          { ...cookie, iat, exp },
          secret,
          AlgorithmTypes.HS512,
        );
        return value;
      },
      commit = async () => {
        context.cookie(cookieName, await getToken(), {
          maxAge,
          ...cookieOptions,
        });
      };
    return new Proxy({ flash, commit, getToken }, {
      get(t, p, __) {
        if (p in t) return t[p as never];
        return cookie[p as never];
      },
      set(t, p, v, __) {
        if (p in t) return false;
        cookie[p as never] = v;
        return true;
      },
    }) as unknown as JWTSession;
  };
  return async (c: Context) => {
    const parsed = await parseJwt(c.req.cookie(cookieName));
    return proxy(c, parsed ?? {});
  };
}

export const getSessionDefault = jwtSession();

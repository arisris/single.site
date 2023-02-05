import {
  Context,
  MiddlewareHandler,
} from "https://deno.land/x/hono@v2.7.2/mod.ts";
import { CookieOptions } from "https://deno.land/x/hono@v2.7.2/utils/cookie.ts";
import { Jwt } from "https://deno.land/x/hono@v2.7.2/utils/jwt/index.ts";

declare module "https://deno.land/x/hono@v2.7.2/mod.ts" {
  export class Context {
    session: Session;
  }
}

type Session = {
  // deno-lint-ignore no-explicit-any
  [k: string]: any | any[] | Record<any, any>;
} & {
  // deno-lint-ignore no-explicit-any
  data: Record<string, any>;
  flash<K extends string, V extends string | undefined>(
    key?: K,
    value?: V,
  ): V | void;
  // expires: (date?: Date) => Date;
  clear: () => void;
};

export function sessionMiddleware(
  cookieOptions?: CookieOptions,
): MiddlewareHandler {
  const options: CookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      ...(cookieOptions ?? {}),
    },
    sessionProxy = (i = {}, f = {}) => {
      const data = new Map(Object.entries(i)),
        flash = new Map(Object.entries(f));
      return new Proxy({
        get data() {
          return Object.fromEntries(data);
        },
        flash(k: string, v: unknown) {
          if (typeof k === "undefined") return Object.fromEntries(flash);
          if (typeof v === "undefined") {
            const d = flash.get(k);
            flash.delete(k);
            return d;
          }
          flash.set(k, v);
        },
        clear() {
          data.clear();
          flash.clear();
        },
      }, {
        set(target, p: string, newValue, _receiver) {
          return p in target ? false : (data.set(p, newValue), true);
        },
        get(target, p: string, _receiver) {
          return p in target ? target[p as never] : data.get(p);
        },
      }) as unknown as Session;
    };
  const getUserCookie = async (c: Context) => {
    let data = {}, flash = {};
    try {
      const value = c.req.cookie("ssb_session");
      if (!!value && (await Jwt.verify(value, "secret"))) {
        const { payload } = Jwt.decode(value);
        if (typeof payload.data === "object") {
          data = payload.data;
        }
        if (typeof payload.flash === "object") {
          flash = payload.flash;
        }
      }
    } catch (e) {
      console.error(e.message);
    }
    return { data, flash };
  };

  return async (c, next) => {
    // dont do session for ws
    if (c.req.headers.has("upgrade")) return next();
    const { data, flash } = await getUserCookie(c);
    c.session = sessionProxy(data, flash);
    await next();
    const currentValue = { data: c.session.data, flash: c.session.flash() };
    if (JSON.stringify({ data, flash }) !== JSON.stringify(currentValue)) {
      // do set-cookie
      c.cookie(
        "ssb_session",
        await Jwt.sign(currentValue, "secret"),
        options,
      );
    }
  };
}


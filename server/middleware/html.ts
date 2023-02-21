import htmldom from "htmldom";
import { type MiddlewareHandler } from "hono/mod.ts";
import { type Configuration, setup as twSetup, tw } from "twind";
import { getStyleTag, virtualSheet } from "twind/sheets";

export type TwindConfig = Omit<Configuration, "sheet">;
export type Options = {
  twindConfig?: TwindConfig;
  excludePaths?: URLPatternInput[];
  appendHead?: string[];
  appendFoot?: string[];
  useAlpine?: boolean;
  alpineScript?: string;
};
export function decorateHtmlOutput(
  {
    twindConfig,
    excludePaths,
    appendHead,
    appendFoot,
    useAlpine = false,
    alpineScript =
      `<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.10.5/dist/cdn.min.js" defer></script>`,
  }: Options = {},
): MiddlewareHandler {
  const sheet = virtualSheet();
  twSetup({ sheet, ...twindConfig });
  return async (ctx, next) => {
    await next();
    const response = ctx.res;

    // ensure only html response like
    // otherwise skiped
    if (response.headers.get("content-type")?.match("text/html")) {
      const url = new URL(ctx.req.url);
      const pathExcluded = excludePaths?.some((input) =>
        new URLPattern(input, url.origin).exec(ctx.req.url)
      );
      // console.log("Skip html modifier", url.pathname)
      // skip if excluded Paths match
      if (pathExcluded) return response;
      const cloned = response.clone();
      const text = await cloned.text();
      // skip if is html like tags
      if (!text.startsWith("<") || !text.endsWith(">")) return response;
      const $$ = htmldom(text);
      const $head = $$("head"), $body = $$("body");
      // also skip if no body or head tag
      if ($head.__length__ < 1 && $body.__length__ < 1) {
        return response;
      }
      // reset stored sheet
      sheet.reset();
      let hasAlpine = false;
      $$("*").each((_: number, tag: {
        attributes?: Record<string, string>;
      }) => {
        if (tag.attributes?.class && tag.attributes.class.length) {
          tag.attributes.class = tw(tag.attributes.class);
        }
        if (useAlpine) {
          if (tag.attributes) {
            for (const key in tag.attributes) {
              if (key.startsWith("x-on-")) {
                tag.attributes["x-on:".concat(key.substring(5))] =
                  tag.attributes[key];
                delete tag.attributes[key];
              }
              if (key.startsWith("x-bind-")) {
                tag.attributes["x-on:".concat(key.substring(7))] = tag.attributes[key];
                delete tag.attributes[key];
              }
            }
          }
          if (
            !hasAlpine &&
            (tag.attributes?.["x-data"] || tag.attributes?.["x-init"])
          ) {
            hasAlpine = true;
          }
        }
      });

      // append style tag to head if sheet is any
      if (sheet.target.length) {
        $head.append(getStyleTag(sheet));
      }
      if (useAlpine && hasAlpine && alpineScript) {
        $head.append(alpineScript);
      }
      if (appendHead) {
        $head.append(appendHead.join("\n"));
      }

      if (appendFoot) {
        $body.append(appendFoot.join("\n"));
      }
      // we can modify now
      ctx.finalized = false;
      return ctx.html($$.beautify());
    }
    return response;
  };
}

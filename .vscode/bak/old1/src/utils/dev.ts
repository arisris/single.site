// deno-lint-ignore-file
import { dirname, fromFileUrl, join, relative } from "std/path/mod.ts";
import { walk } from "std/fs/mod.ts";
export async function dev(base: string) {
  const pages = new URL("./../pages", import.meta.url);
  const files: Record<string, any> = {};
  for await (
    const file of walk(pages, {
      exts: ["ts", "tsx"],
      skip: [/(404|_app).*/],
    })
  ) {
    if (!file.isSymlink && !file.isDirectory) {
      const rel = `./${relative("./", file.path)}`;
      const pattern = `/${relative(pages.pathname, file.path)}`
        .replaceAll("$", ":").replaceAll(/.(ts|tsx)/g, "");
      console.log(pattern);
      files[rel] = await import(new URL(rel, base).href);
    }
  }

  console.log(files);
}

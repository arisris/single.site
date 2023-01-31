/** @jsx jsx */
import { html, jsx } from "hono/middleware.ts";
import { JSXChild } from "../types.ts";

export default function Document(props: {
  title?: string;
  description?: string;
  headers?: JSXChild;
  footers?: JSXChild;
  children?: JSXChild;
}) {
  return html`<!DOCTYPE html>${(
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {props.title && <title>{props.title}</title>}
        {props.description && (
          <meta name="description" content={props.description} />
        )}
        {props.headers}
      </head>
      <body>
        {props.children}
        {props.footers}
      </body>
    </html>
  )}`;
}

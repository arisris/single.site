/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import Document from "../layouts/document.tsx";

export default ({ pathname }: { pathname: string }) => {
  return (
    <Document title="404 Not Found">
      <h3>Page Not Found</h3>
      <p>
        The page you requested "<b>{pathname}</b>" was not found on our server
      </p>
      <p>
        <a href="/">&laquo; Back to home</a>
      </p>
    </Document>
  );
};

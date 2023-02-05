/** @jsx jsx */
import { jsx, JSXChild } from "../types.ts";
import Document from "./document.tsx";

export default function AppLayout(props: {
  title?: string;
  description?: string;
  noscript?: boolean;
  children?: JSXChild;
}) {
  return (
    <Document
      title={props.title}
      description={props.description}
    >
      <section class="font-sans p-4 flex flex-col justify-between min-h-[92vh] mx-auto max-w-screen-sm">
        <header>
          <div class="flex justify-between items-center">
            <a href="/" class="text-xl no-underline font-bold font-sans">
              K🐸dok
            </a>
            <div class="inline-flex gap-2 justify-center">
              <a href="/tools">Tools</a>
              <a href="/docs">Documentation</a>
            </div>
          </div>
          <h1>{props.title || "Kodok.site"}</h1>
        </header>
        <main class="flex-auto mb-8">
          {props.children}
        </main>
        <footer class="flex flex-col sm:flex-row-reverse gap-2 justify-between items-center">
          <div class="flex gap-2 flex-nowrap">
            <a href="/privacy-policy">Privacy policy</a>
            <a href="/terms-of-service">Terms of service</a>
          </div>
          <div class="flex items-center gap-1">
            <span>&copy; {new Date().getFullYear()}</span>
            <a href="/" class="no-underline">Kodok.site</a>
          </div>
        </footer>
      </section>
    </Document>
  );
}

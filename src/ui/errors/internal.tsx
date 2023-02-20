import Document from "../layouts/document.tsx";

export default (
  { error, debug }: { error: Error; debug: boolean },
) => {
  return (
    <Document title="404 Not Found">
      <h3>{error.message}</h3>
      {!debug && <pre>{error.stack}</pre>}
      <p>
        <a href="/">&laquo; Back to home</a>
      </p>
    </Document>
  );
};

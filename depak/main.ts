import { serve } from "https://deno.land/std@0.173.0/http/server.ts";

const handleRequest = async (req: Request) => {
  const url = new URL(req.url);
  await Promise.resolve(1);
  return new Response("Not Found", { status: 404 });
};

serve(handleRequest, { port: 3000 });

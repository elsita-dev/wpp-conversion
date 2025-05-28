export interface Env {
  DB: D1Database;
}

function extractUUID(text: string): string | null {
  const uuidRegex =
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
  const match = text.match(uuidRegex);
  return match ? match[0] : null;
}

export default {
  async fetch(request: Request, env: Env) {
    const { method, url } = request;
    const pathname = new URL(url).pathname;

    if (method === "POST" && pathname === "/webhook") {
      const body = await request.json();
      console.log({ body });
    }
    return new Response("Not found", { status: 404 });
  },
};

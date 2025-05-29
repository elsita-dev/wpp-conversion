export interface Env {
  DB: D1Database;
}

function extractUUID(text: string | undefined | null): string | null {
  if (typeof text !== "string") return null;
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

      const message = body?.text;
      const contactTitle = body?.contact?.channel?.title;
      const uuid = extractUUID(message);

      if (!uuid || !contactTitle) {
        return new Response("ok", { status: 200 });
      }

      // Buscar fila en la base de datos
      const { results } = await env.DB.prepare(
        `
        SELECT id, business_name, conversion 
        FROM conversions 
        WHERE conversion_id = ? LIMIT 1
      `
      )
        .bind(uuid)
        .all();

      const match = results[0];

      if (
        match &&
        match.business_name === contactTitle &&
        match.conversion === 0
      ) {
        // Actualizar la conversión a 1
        await env.DB.prepare(
          `
          UPDATE conversions 
          SET conversion = 1 
          WHERE id = ?
        `
        )
          .bind(match.id)
          .run();

        return new Response("Conversion updated", { status: 201 });
      }

      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },
};

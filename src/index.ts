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
      try {
        const body = await request.json();
        console.log("Incoming body:", JSON.stringify(body));

        const message = body?.payload?.text;
        const contactTitle = body?.payload?.contact?.channel?.title; // e.g., "API ASTRO 3"
        const uuid = extractUUID(message);
        console.log({ uuid });

        if (!uuid || !contactTitle) {
          return new Response("Missing UUID or contact title", { status: 200 });
        }

        // Buscar coincidencia exacta por UUID
        const { results } = await env.DB.prepare(
          `
          SELECT id, business_name, conversion 
          FROM Leads 
          WHERE conversion_id = ? LIMIT 1
        `
        )
          .bind(uuid)
          .all();

        const match = results[0];

        if (
          match &&
          match.business_name.toLowerCase() === contactTitle.toLowerCase() &&
          match.conversion === 0
        ) {
          await env.DB.prepare(
            `
            UPDATE Leads 
            SET conversion = 1 
            WHERE conversion_id = ?
          `
          )
            .bind(uuid)
            .run();

          return new Response("Conversion updated", { status: 201 });
        }

        return new Response("No update needed", { status: 200 });
      } catch (err) {
        console.error("Error handling webhook:", err);
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

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
  async fetch(request: Request, env: Env): Promise<Response> {
    const { method, url } = request;
    const pathname = new URL(url).pathname;

    if (method === "POST" && pathname === "/webhook") {
      try {
        const body = await request.json();

        if (body.type === "new_message") {
          const message = body.data;
          const { content } = message;

          // 1. Verificamos si el contenido incluye un UUID
          const uuid = extractUUID(content);
          if (!uuid) {
            console.log("Mensaje recibido, pero sin UUID válido");
            return new Response("UUID no encontrado", { status: 204 });
          }

          // 2. Buscamos el UUID en la base
          const result = await env.DB.prepare(
            `
            SELECT * FROM leads WHERE conversionId = ? LIMIT 1
          `
          )
            .bind(uuid)
            .first();

          if (!result) {
            console.log("UUID no encontrado en base de datos:", uuid);
            return new Response("UUID no registrado", { status: 204 });
          }

          if (result.conversion === 0) {
            // 3. Actualizamos conversion a 1
            await env.DB.prepare(
              `
              UPDATE leads SET conversion = 1 WHERE conversionId = ?
            `
            )
              .bind(uuid)
              .run();

            console.log("Conversión registrada para UUID:", uuid);
          } else {
            console.log("Conversión ya estaba registrada:", uuid);
          }

          return new Response("Procesado correctamente", { status: 200 });
        }

        return new Response("Evento no manejado", { status: 204 });
      } catch (err) {
        console.error("Error procesando webhook:", err);
        return new Response("Error interno", { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

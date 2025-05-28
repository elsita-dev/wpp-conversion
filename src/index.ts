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
      const haveUUID = extractUUID(message);
      if (haveUUID) return new Response("created", { status: 201 });
      return new Response("ok", { status: 200 });
    }
    return new Response("Not found", { status: 404 });
  },
};

/* 

{
  "to": "5491126415268",
  "from": "5492215929898",
  "text": "hola f0b3a801-049f-4867-ba04-0efcbe8febf6",
  "uuid": "wamid.HBgNNTQ5MjIxNTkyOTg5OBUCABIYFjNFQjBDMzI0NkNFQjdEN0Q1M0M5RUQA",
  "status": "received",
  "channel": "whatsapp",
  "contact": {
    "href": "https://dash.callbell.eu/contacts/fb7529d884ce4e17a11bf9d2f2de7638",
    "name": "Shumi",
    "tags": [],
    "team": {
      "name": "General",
      "uuid": "b5278e2a237b471bbd47f14acafc4744",
      "default": true,
      "members": 1,
      "createdAt": "2025-01-10T21:17:52Z"
    },
    "uuid": "fb7529d884ce4e17a11bf9d2f2de7638",
    "source": "whatsapp",
    "channel": {
      "main": false,
      "type": "whatsapp",
      "uuid": "27d1890e9dc14129bc6dd5dfcc0f5782",
      "title": "API IMPERIO 1"
    },
    "closedAt": null,
    "avatarUrl": null,
    "blockedAt": null,
    "createdAt": "2025-05-28T17:27:09Z",
    "phoneNumber": "5492215929898",
    "assignedUser": null,
    "customFields": {},
    "conversationHref": "https://dash.callbell.eu/chat/76bfdb36413049d5a2a9d8ce92a093df"
  },
  "createdAt": "2025-05-28T17:27:06Z"
}


*/

import type { Client } from "@libsql/client";

export type PushMessage = { title: string; body: string };

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendExpoPush(
  tokens: string[],
  message: PushMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  if (tokens.length === 0) return [];
  const res = await fetchImpl(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        sound: "default",
        title: message.title,
        body: message.body,
      })),
    ),
  });
  if (!res.ok) throw new Error(`Expo push failed: ${res.status}`);
  const body = (await res.json()) as {
    data?: { status: string; details?: { error?: string } }[];
  };
  const invalid: string[] = [];
  body.data?.forEach((ticket, i) => {
    if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
      invalid.push(tokens[i]);
    }
  });
  return invalid;
}

export async function notifyOrder(
  db: Client,
  orderId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const claim = await db.execute({
    sql: "INSERT OR IGNORE INTO notified_orders (order_id) VALUES (?)",
    args: [orderId],
  });
  if (claim.rowsAffected === 0) return false;

  const tokensRs = await db.execute("SELECT token FROM push_tokens");
  const tokens = tokensRs.rows.map((r) => String(r.token));
  const invalid = await sendExpoPush(
    tokens,
    { title: "New order", body: "You have a new order in the app" },
    fetchImpl,
  );
  for (const token of invalid) {
    await db.execute({ sql: "DELETE FROM push_tokens WHERE token = ?", args: [token] });
  }
  return true;
}
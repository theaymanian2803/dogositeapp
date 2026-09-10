import type { Context, Next } from "hono";
import { sign, verify } from "hono/jwt";

declare module "hono" {
  interface ContextVariableMap {
    adminEmail: string;
  }
}

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function signAdminToken(email: string, secret: string): Promise<string> {
  return sign(
    { sub: email, exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS },
    secret,
  );
}

export function requireAdmin(secret: string) {
  return async (c: Context, next: Next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    try {
      const payload = await verify(header.slice("Bearer ".length), secret, "HS256");
      c.set("adminEmail", String(payload.sub));
      await next();
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }
  };
}
/**
 * Auth Middleware
 *
 * Simple token-based authentication middleware.
 * Demonstrates:
 * - Authorization header validation
 * - Setting user context
 * - Error responses
 */

import type { Context, Next } from "hono";

// Simulated user database
const validTokens = new Map([
  ["token-alice", { id: 1, name: "Alice", role: "admin" }],
  ["token-bob", { id: 2, name: "Bob", role: "user" }]
]);

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  // Expected format: "Bearer token-alice"
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return c.json({ error: "Invalid Authorization format. Use: Bearer <token>" }, 401);
  }

  const user = validTokens.get(token);

  if (!user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  // Set user in context for route handlers
  c.set("user", user);

  await next();
};

/**
 * Admin-only middleware
 * Must be used after authMiddleware
 */
export const adminOnlyMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user || user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  await next();
};

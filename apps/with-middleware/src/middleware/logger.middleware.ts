/**
 * Logger Middleware
 *
 * Logs all incoming requests with:
 * - HTTP method
 * - Request path
 * - Response time
 * - Status code
 */

import type { Context, Next } from "hono";

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  console.log(`→ ${method} ${path}`);

  await next();

  const ms = Date.now() - start;
  const status = c.res.status;

  const statusColor = status >= 500 ? "\x1b[31m" : // Red for 5xx
                      status >= 400 ? "\x1b[33m" : // Yellow for 4xx
                      status >= 300 ? "\x1b[36m" : // Cyan for 3xx
                      "\x1b[32m"; // Green for 2xx

  console.log(`← ${method} ${path} ${statusColor}${status}\x1b[0m ${ms}ms`);
};

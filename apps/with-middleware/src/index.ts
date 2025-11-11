/**
 * Middleware Example Application
 *
 * Demonstrates:
 * - Global middleware
 * - Route-specific middleware
 * - Authentication middleware
 * - Authorization (admin-only) middleware
 * - Logging middleware
 * - Context manipulation
 */

import { defineController, defineModule, createApp } from "kaheljs";
import type { Context, Next } from "hono";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { authMiddleware, adminOnlyMiddleware } from "./middleware/auth.middleware";

// ============================================================================
// Controllers
// ============================================================================

/**
 * Public routes - No authentication required
 */
const publicController = defineController("/public", (r) => {
  r.get("/", (c) => {
    return c.json({
      message: "This is a public endpoint",
      authentication: "not required"
    });
  });

  r.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  });
});

/**
 * Protected routes - Authentication required
 */
const protectedController = defineController("/api", (r) => {
  // Apply auth middleware to all routes in this controller
  // IMPORTANT: Middleware must be registered BEFORE the routes
  r.use("*", authMiddleware);

  r.get("/profile", (c) => {
    const user = c.get("user");
    return c.json({
      message: "Welcome to your profile",
      user
    });
  });

  r.get("/data", (c) => {
    const user = c.get("user");
    return c.json({
      data: ["item1", "item2", "item3"],
      accessedBy: user.name
    });
  });

  // Admin-only route - apply additional middleware for this specific route
  r.get("/admin/dashboard", adminOnlyMiddleware, (c) => {
    const user = c.get("user");
    return c.json({
      message: "Admin Dashboard",
      admin: user.name,
      stats: {
        totalUsers: 100,
        activeUsers: 85,
        revenue: 50000
      }
    });
  });
});
/**
 * Mixed routes - Some require auth, some don't
 */
const mixedController = defineController("/mixed", (r) => {
  // Public route
  r.get("/info", (c) => {
    return c.json({ info: "Public information" });
  });

  // Protected route
  r.get("/secret", authMiddleware, (c) => {
    const user = c.get("user");
    return c.json({
      secret: "This is secret data",
      revealedTo: user.name
    });
  });
});

// ============================================================================
// Module
// ============================================================================

const appModule = defineModule({
  controllers: [publicController, protectedController, mixedController]
});

// ============================================================================
// Bootstrap
// ============================================================================

// Apply global middleware by passing them to createApp
// This ensures they run BEFORE controller routes are mounted
const app = createApp(appModule, {
  middleware: [
    // Logger middleware - logs all requests
    loggerMiddleware,

    // CORS middleware - handles cross-origin requests
    async (c: Context, next: Next) => {
      c.header("Access-Control-Allow-Origin", "*");
      c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (c.req.method === "OPTIONS") {
        return new Response(null, { status: 204 });
      }

      await next();
    }
  ]
});

const port = 3003;

console.log(`🚀 Middleware example running at http://localhost:${port}`);
console.log(`\nAvailable routes:`);
console.log(`\n  Public (no auth):`);
console.log(`    GET  /public/        - Public endpoint`);
console.log(`    GET  /public/health  - Health check`);
console.log(`    GET  /mixed/info     - Public info`);
console.log(`\n  Protected (requires auth):`);
console.log(`    GET  /api/profile    - User profile`);
console.log(`    GET  /api/data       - User data`);
console.log(`    GET  /mixed/secret   - Secret data`);
console.log(`\n  Admin only:`);
console.log(`    GET  /api/admin/dashboard - Admin dashboard`);
console.log(`\nValid tokens for testing:`);
console.log(`  - Bearer token-alice (admin)`);
console.log(`  - Bearer token-bob (user)`);

export default {
  port,
  fetch: app.fetch
};

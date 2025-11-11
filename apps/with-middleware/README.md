# Middleware Example

Demonstrates various middleware patterns in KahelJS including authentication, logging, and CORS.

## Features

- ✅ Global middleware (logging, CORS)
- ✅ Controller-level middleware (authentication)
- ✅ Route-specific middleware (admin-only)
- ✅ Context manipulation
- ✅ Error responses
- ✅ Token-based authentication

## Project Structure

```
src/
  ├── index.ts                        # Application bootstrap
  └── middleware/
      ├── logger.middleware.ts        # Request/response logging
      └── auth.middleware.ts          # Authentication & authorization
```

## Running

```bash
# Install dependencies (from root)
bun install

# Run in development mode (with hot reload)
bun run dev

# Run in production mode
bun run start
```

## Testing the API

### Public Endpoints (No Auth Required)

```bash
# Public endpoint
curl http://localhost:3003/public/

# Health check
curl http://localhost:3003/public/health

# Public info
curl http://localhost:3003/mixed/info
```

### Protected Endpoints (Auth Required)

```bash
# Get profile (with token)
curl http://localhost:3003/api/profile \
  -H "Authorization: Bearer token-alice"

# Get data
curl http://localhost:3003/api/data \
  -H "Authorization: Bearer token-bob"

# Secret data
curl http://localhost:3003/mixed/secret \
  -H "Authorization: Bearer token-alice"
```

### Admin-Only Endpoints

```bash
# Admin dashboard (alice is admin)
curl http://localhost:3003/api/admin/dashboard \
  -H "Authorization: Bearer token-alice"

# Try with non-admin (will fail with 403)
curl http://localhost:3003/api/admin/dashboard \
  -H "Authorization: Bearer token-bob"
```

### Testing Auth Failures

```bash
# No token
curl http://localhost:3003/api/profile

# Invalid token
curl http://localhost:3003/api/profile \
  -H "Authorization: Bearer invalid-token"

# Wrong format
curl http://localhost:3003/api/profile \
  -H "Authorization: token-alice"
```

## Middleware Patterns

### 1. Global Middleware

Applied to all routes by passing middleware array to `createApp`:

```typescript
const app = createApp(appModule, {
  middleware: [
    loggerMiddleware,
    corsMiddleware
  ]
});
```

This ensures middleware runs BEFORE controller routes are mounted, so it applies to all routes.

### 2. Controller-Level Middleware

Applied to all routes in a controller using `r.use()`:

```typescript
const protectedController = defineController("/api", (r) => {
  // IMPORTANT: Call r.use() BEFORE defining routes
  r.use("*", authMiddleware);

  // All routes below will have authMiddleware applied
  r.get("/profile", (c) => {
    const user = c.get("user"); // Set by authMiddleware
    return c.json({ user });
  });

  r.get("/data", (c) => {
    const user = c.get("user"); // Also has authMiddleware
    return c.json({ data: [], user });
  });
});
```

You can also apply middleware to specific paths:

```typescript
const apiController = defineController("/api", (r) => {
  // Public routes (no middleware)
  r.get("/health", (c) => c.json({ status: "ok" }));

  // Apply middleware only to admin routes
  r.use("/admin/*", authMiddleware, adminOnlyMiddleware);

  // Only these routes will have the middleware
  r.get("/admin/users", (c) => c.json({ users: [] }));
  r.get("/admin/settings", (c) => c.json({ settings: {} }));
});
```

### 3. Route-Specific Middleware

Applied to individual routes:

```typescript
r.get("/admin/dashboard", adminOnlyMiddleware, (c) => {
  // Only admins can access this
  return c.json({ secret: "data" });
});
```

### 4. Chaining Multiple Middleware

```typescript
r.get("/secret", authMiddleware, adminOnlyMiddleware, rateLimitMiddleware, (c) => {
  // All middleware run in order
  return c.json({ data });
});
```

## What You'll Learn

1. **Global Middleware**: Apply middleware to all routes
2. **Controller Middleware**: Apply middleware to specific controller routes
3. **Route Middleware**: Apply middleware to individual routes
4. **Authentication**: Validate tokens and set user context
5. **Authorization**: Check user roles and permissions
6. **Logging**: Track requests and responses
7. **CORS**: Handle cross-origin requests
8. **Context**: Manipulate request context with `c.set()` and `c.get()`

## Middleware Order

```
Request
  ↓
Global Middleware (loggerMiddleware, CORS)
  ↓
Controller Middleware (authMiddleware on /api/*)
  ↓
Route Middleware (adminOnlyMiddleware on /admin/dashboard)
  ↓
Route Handler
  ↓
Response
```

## Next Steps

- **testing-example** - See how to test middleware in isolation
- Explore Hono's built-in middleware: https://hono.dev/middleware/builtin/logger

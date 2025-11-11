# KahelJS

A zero-overhead, NestJS-style framework for Hono with functional patterns and type-safe dependency injection.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4.0%2B-orange)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-black)](https://bun.sh/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Examples](#examples)
- [Core Concepts](#core-concepts)
  - [Injectables (Services)](#injectables-services)
  - [Controllers](#controllers)
  - [Modules](#modules)
  - [Dependency Injection](#dependency-injection)
- [Advanced Usage](#advanced-usage)
  - [Module Composition](#module-composition)
  - [Middleware](#middleware)
  - [Using Hono Middleware](#using-hono-middleware)
  - [Error Handling](#error-handling)
  - [Configuration](#configuration)
- [Testing](#testing)
  - [Unit Testing Services](#unit-testing-services)
  - [Integration Testing Controllers](#integration-testing-controllers)
  - [E2E Testing](#e2e-testing)
  - [Test Utilities Reference](#test-utilities-reference)
- [Integration with Hono Ecosystem](#integration-with-hono-ecosystem)
  - [OpenAPI](#openapi)
  - [CORS](#cors)
  - [JWT Authentication](#jwt-authentication)
  - [Rate Limiting](#rate-limiting)
- [Performance](#performance)
- [Architecture](#architecture)
- [API Reference](#api-reference)

---

## Overview

KahelJS brings the beloved developer experience of NestJS to Hono, but with a functional, zero-overhead approach. All dependency injection happens at application startup, resulting in pure Hono performance at runtime.

```typescript
// Define a service
const UserService = defineInjectable(() => ({
  findAll: () => [{ id: 1, name: "John" }]
}));

// Define a controller
const usersController = defineController("/users", (r, deps) => {
  const users = deps.get(UserService);

  r.get("/", (c) => c.json({ users: users.findAll() }));
});

// Create a module
const appModule = defineModule({
  controllers: [usersController],
  providers: [UserService.provider]
});

// Bootstrap the app
const app = createApp(appModule);
```

---

## Features

- ✅ **Zero Runtime Overhead** - All DI resolved at startup, pure Hono performance
- ✅ **Functional Pattern** - No classes or decorators required
- ✅ **Type-Safe DI** - Full TypeScript inference for dependencies
- ✅ **Module System** - Organize code with imports/exports like NestJS
- ✅ **100% Hono Compatible** - Use any Hono middleware seamlessly
- ✅ **Circular Dependency Detection** - Clear error messages at startup
- ✅ **Testing Utilities** - Easy mocking and testing
- ✅ **Bun/Node/Cloudflare Workers** - Works everywhere Hono works

---

## Installation

```bash
bun add kaheljs hono
# or
npm install kaheljs hono
```

For validation (optional):
```bash
bun add zod
```

---

## Quick Start

### 1. Create a Service

```typescript
// services/user.service.ts
import { defineInjectable } from "kaheljs";

export const UserService = defineInjectable(() => ({
  findAll: () => {
    return [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" }
    ];
  },

  findById: (id: number) => {
    const users = [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" }
    ];
    return users.find(u => u.id === id);
  }
}));
```

### 2. Create a Controller

```typescript
// controllers/users.controller.ts
import { defineController } from "kaheljs";
import { UserService } from "../services/user.service";

export const usersController = defineController("/users", (r, deps) => {
  const userService = deps.get(UserService);

  r.get("/", (c) => {
    const users = userService.findAll();
    return c.json({ users });
  });

  r.get("/:id", (c) => {
    const id = Number(c.req.param("id"));
    const user = userService.findById(id);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  });
});
```

### 3. Create a Module

```typescript
// modules/users.module.ts
import { defineModule } from "kaheljs";
import { usersController } from "../controllers/users.controller";
import { UserService } from "../services/user.service";

export const usersModule = defineModule({
  controllers: [usersController],
  providers: [UserService.provider]
});
```

### 4. Bootstrap the Application

```typescript
// index.ts
import { createApp } from "kaheljs";
import { usersModule } from "./modules/users.module";

const appModule = defineModule({
  imports: [usersModule]
});

const app = createApp(appModule);

// Bun
Bun.serve({
  port: 3000,
  fetch: app.fetch
});

console.log("Server running on http://localhost:3000");
```

---

## Examples

KahelJS includes comprehensive examples in the `apps/` folder demonstrating various patterns and use cases:

### 🎯 [basic](./apps/basic) - Getting Started
Port: 3000 | Simple hello world application

**What you'll learn:**
- Creating services with `defineInjectable`
- Defining routes with `defineController`
- Organizing with `defineModule`
- Testing with `kaheljs-test`

```bash
cd apps/basic && bun run dev
curl http://localhost:3000/greet/John
```

### 📝 [todo-api](./apps/todo-api) - CRUD API
Port: 3001 | Full REST API with service layer pattern

**What you'll learn:**
- Service layer pattern
- Request validation
- Error handling
- TypeScript DTOs

```bash
cd apps/todo-api && bun run dev
curl -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn KahelJS"}'
```

### 🏗️ [multi-module](./apps/multi-module) - Modular Architecture
Port: 3002 | Complex application with module composition and SQLite

**What you'll learn:**
- Module imports and exports
- Shared infrastructure modules
- SQLite with bun:sqlite
- Cross-module dependencies

```bash
cd apps/multi-module && bun run dev
curl http://localhost:3002/posts  # Posts with author info
```

### 🔐 [with-middleware](./apps/with-middleware) - Authentication & Logging
Port: 3003 | Middleware patterns for auth, logging, and CORS

**What you'll learn:**
- Authentication middleware
- Role-based authorization
- Request logging
- CORS handling

```bash
cd apps/with-middleware && bun run dev
curl http://localhost:3003/api/profile \
  -H "Authorization: Bearer token-alice"
```

### 📖 More Information

Each example includes:
- Complete source code with extensive comments
- Dedicated README with detailed explanations
- Architecture diagrams
- API documentation with curl examples

Visit the [examples folder](./apps) to explore all examples.

---

## Core Concepts

### Injectables (Services)

Injectables are functional services that can be injected into controllers or other services.

#### Basic Injectable

```typescript
const ConfigService = defineInjectable(() => ({
  apiUrl: "https://api.example.com",
  timeout: 5000
}));
```

#### Injectable with Dependencies

```typescript
const DatabaseService = defineInjectable(() => ({
  query: async (sql: string) => {
    // Database logic
    return [];
  }
}));

const UserService = defineInjectable(
  (db) => ({
    findAll: async () => {
      return await db.query("SELECT * FROM users");
    },

    create: async (data: any) => {
      return await db.query("INSERT INTO users ...", data);
    }
  }),
  [DatabaseService] as const  // Dependencies array
);
```

#### Multiple Dependencies

```typescript
const PostService = defineInjectable(
  (userService, db, cache) => ({
    async findAllWithAuthors() {
      const cached = cache.get("posts");
      if (cached) return cached;

      const posts = await db.query("SELECT * FROM posts");
      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => ({
          ...post,
          author: await userService.findById(post.authorId)
        }))
      );

      cache.set("posts", postsWithAuthors);
      return postsWithAuthors;
    }
  }),
  [UserService, DatabaseService, CacheService] as const
);
```

#### Advanced Configuration

```typescript
const LoggerService = defineInjectable({
  name: "Logger",
  lifetime: "transient",  // New instance per request
  factory: (config) => ({
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`)
  }),
  deps: [ConfigService]
});
```

### Controllers

Controllers define HTTP routes and handle requests.

#### Basic Controller

```typescript
const healthController = defineController("/health", (r, deps) => {
  r.get("/", (c) => {
    return c.json({ status: "ok", timestamp: Date.now() });
  });
});
```

#### Controller with All HTTP Methods

```typescript
const postsController = defineController("/posts", (r, deps) => {
  const postService = deps.get(PostService);

  // GET /posts
  r.get("/", async (c) => {
    const posts = await postService.findAll();
    return c.json({ posts });
  });

  // GET /posts/:id
  r.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const post = await postService.findById(id);
    return c.json({ post });
  });

  // POST /posts
  r.post("/", async (c) => {
    const body = await c.req.json();
    const post = await postService.create(body);
    return c.json({ post }, 201);
  });

  // PUT /posts/:id
  r.put("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const post = await postService.update(id, body);
    return c.json({ post });
  });

  // DELETE /posts/:id
  r.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await postService.delete(id);
    return c.json({ success: true });
  });

  // PATCH /posts/:id
  r.patch("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const post = await postService.patch(id, body);
    return c.json({ post });
  });
});
```

#### Nested Routes

```typescript
const usersController = defineController("/users", (r, deps) => {
  const userService = deps.get(UserService);

  r.get("/", async (c) => {
    return c.json({ users: await userService.findAll() });
  });

  // /users/:id/posts
  r.get("/:id/posts", async (c) => {
    const userId = Number(c.req.param("id"));
    const posts = await userService.getPostsByUser(userId);
    return c.json({ posts });
  });

  // /users/:id/profile
  r.get("/:id/profile", async (c) => {
    const userId = Number(c.req.param("id"));
    const profile = await userService.getProfile(userId);
    return c.json({ profile });
  });
});
```

### Modules

Modules organize your application into cohesive feature blocks.

#### Basic Module

```typescript
const usersModule = defineModule({
  controllers: [usersController],
  providers: [UserService.provider]
});
```

#### Module with Imports

```typescript
// Database module (shared)
const databaseModule = defineModule({
  providers: [DatabaseService.provider],
  exports: [DatabaseService]  // Make available to importing modules
});

// Users module (imports database)
const usersModule = defineModule({
  imports: [databaseModule],  // Import database module
  controllers: [usersController],
  providers: [UserService.provider],
  exports: [UserService]  // Export for other modules
});
```

#### Root Module

```typescript
const appModule = defineModule({
  imports: [
    databaseModule,
    usersModule,
    postsModule,
    authModule
  ]
});

const app = createApp(appModule);
```

### Dependency Injection

The DI container resolves all dependencies at startup.

#### Accessing Services in Controllers

```typescript
const usersController = defineController("/users", (r, deps) => {
  // Resolve services once at startup
  const userService = deps.get(UserService);
  const authService = deps.get(AuthService);

  r.get("/", (c) => {
    // Services are available in all routes
    const users = userService.findAll();
    return c.json({ users });
  });
});
```

#### Manual DI Container Usage

```typescript
import { DIContainer } from "kaheljs";

const container = new DIContainer();

// Register providers
container.register(UserService.provider);
container.register({
  provide: "CONFIG",
  useValue: { apiUrl: "https://api.example.com" }
});

// Resolve services
const userService = container.get(UserService);
const config = container.get("CONFIG");
```

---

## Advanced Usage

### Module Composition

#### Shared Module Pattern

```typescript
// shared.module.ts
const sharedModule = defineModule({
  providers: [
    LoggerService.provider,
    ConfigService.provider,
    CacheService.provider
  ],
  exports: [LoggerService, ConfigService, CacheService]
});

// feature.module.ts
const featureModule = defineModule({
  imports: [sharedModule],  // All exports available
  controllers: [featureController],
  providers: [FeatureService.provider]
});
```

#### Feature Module Pattern

```typescript
// Each feature has its own module
const usersModule = defineModule({
  controllers: [usersController],
  providers: [UserService.provider],
  exports: [UserService]
});

const postsModule = defineModule({
  imports: [usersModule],  // Posts depends on Users
  controllers: [postsController],
  providers: [PostService.provider]
});

const appModule = defineModule({
  imports: [usersModule, postsModule]
});
```

### Middleware

KahelJS controllers receive Hono handlers, so middleware works exactly like Hono.

#### Controller-Level Middleware

Apply middleware to all routes in a controller using `r.use()`:

```typescript
// auth.middleware.ts
const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Verify token
  const user = await verifyToken(token);
  c.set("user", user);

  await next();
};

// Apply middleware to all routes in controller
const usersController = defineController("/users", (r, deps) => {
  // IMPORTANT: Call r.use() BEFORE defining routes
  r.use("*", authMiddleware);

  // All routes below will have auth middleware applied
  r.get("/", (c) => {
    const user = c.get("user");  // Available from middleware
    return c.json({ user });
  });

  r.get("/:id", (c) => {
    const user = c.get("user");  // Available from middleware
    const id = c.req.param("id");
    return c.json({ user, id });
  });
});
```

You can also apply middleware to specific paths within a controller:

```typescript
const apiController = defineController("/api", (r, deps) => {
  // Public routes (no middleware)
  r.get("/health", (c) => c.json({ status: "ok" }));
  r.get("/version", (c) => c.json({ version: "1.0.0" }));

  // Apply auth middleware only to admin routes
  r.use("/admin/*", authMiddleware, adminOnlyMiddleware);

  // These routes will have both middlewares applied
  r.get("/admin/users", (c) => c.json({ users: [] }));
  r.get("/admin/settings", (c) => c.json({ settings: {} }));
});
```

#### Route-Specific Middleware

Apply middleware to individual routes:

```typescript
const usersController = defineController("/users", (r, deps) => {
  // Apply middleware to specific routes
  r.get("/profile", authMiddleware, (c) => {
    const user = c.get("user");
    return c.json({ user });
  });

  // Multiple middleware on one route
  r.post("/", authMiddleware, validateBody, async (c) => {
    const body = await c.req.json();
    return c.json({ created: true }, 201);
  });

  // Some routes without middleware
  r.get("/public", (c) => {
    return c.json({ message: "Public endpoint" });
  });
});
```

#### Global Middleware

Apply global middleware by passing it to `createApp`:

```typescript
const app = createApp(appModule, {
  middleware: [
    loggerMiddleware,
    async (c, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      c.header("X-Response-Time", `${ms}ms`);
    }
  ]
});
```

**Note:** The returned app does NOT have a `use()` method. This is intentional to prevent confusion about middleware ordering. All global middleware must be passed to `createApp()`.

#### DI in Middleware

```typescript
// Create middleware factory with DI
function createAuthMiddleware(deps: DIContainer) {
  const authService = deps.get(AuthService);

  return async (c: Context, next: Next) => {
    const token = c.req.header("Authorization");
    const user = await authService.verify(token);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", user);
    await next();
  };
}

// Use in controller
const usersController = defineController("/users", (r, deps) => {
  const authMiddleware = createAuthMiddleware(deps);

  r.get("/profile", authMiddleware, (c) => {
    const user = c.get("user");
    return c.json({ user });
  });
});
```


### Using Hono Middleware

KahelJS is 100% compatible with all Hono middleware. Pass them to `createApp`:

```typescript
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { compress } from "hono/compress";

const app = createApp(appModule, {
  middleware: [
    // Use any Hono middleware
    logger(),
    prettyJSON(),
    compress(),

    // CORS
    cors({
      origin: ["https://example.com"],
      credentials: true
    })
  ]
});
```

For route-specific middleware (like JWT on /api/*), use `r.use()` in your controller:

```typescript
import { jwt } from "hono/jwt";

const apiController = defineController("/api", (r, deps) => {
  // Apply JWT auth to all /api routes
  r.use("*", jwt({ secret: "your-secret-key" }));

  r.get("/protected", (c) => {
    const payload = c.get("jwtPayload");
    return c.json({ payload });
  });
});
```

### Error Handling

#### Global Error Handler

```typescript
const app = createApp(appModule);

app.onError((err, c) => {
  console.error(`Error: ${err.message}`);

  if (err instanceof ValidationError) {
    return c.json({ error: err.message, details: err.errors }, 400);
  }

  if (err instanceof UnauthorizedError) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ error: "Internal Server Error" }, 500);
});
```

#### Custom Error Classes

```typescript
class HttpException extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

class BadRequestException extends HttpException {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

// Use in service
const UserService = defineInjectable((db) => ({
  async findById(id: number) {
    const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }
}));
```

### Configuration

#### Environment-Based Config

```typescript
const ConfigService = defineInjectable(() => {
  const env = process.env.NODE_ENV || "development";

  return {
    env,
    isDevelopment: env === "development",
    isProduction: env === "production",

    database: {
      url: process.env.DATABASE_URL || "sqlite://db.sqlite",
      pool: Number(process.env.DB_POOL_SIZE) || 10
    },

    jwt: {
      secret: process.env.JWT_SECRET || "dev-secret",
      expiresIn: process.env.JWT_EXPIRES || "7d"
    },

    server: {
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || "localhost"
    }
  };
});

// Use in other services
const DatabaseService = defineInjectable(
  (config) => {
    const db = createDatabase(config.database.url);
    return {
      query: (sql: string) => db.query(sql)
    };
  },
  [ConfigService] as const
);
```

---

## Testing

### Unit Testing Services

Test services in isolation by calling their factory functions directly.

```typescript
// user.service.test.ts
import { describe, test, expect } from "bun:test";
import { UserService } from "./user.service";

describe("UserService", () => {
  test("findAll returns all users", () => {
    // Mock dependencies
    const mockDb = {
      query: () => [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" }
      ]
    };

    // Call factory directly - no DI container needed
    const service = UserService.factory(mockDb);

    const users = service.findAll();
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe("John");
  });

  test("findById returns single user", () => {
    const mockDb = {
      query: (sql: string, params: any[]) => {
        return { id: params[0], name: "John" };
      }
    };

    const service = UserService.factory(mockDb);

    const user = service.findById(1);
    expect(user.id).toBe(1);
    expect(user.name).toBe("John");
  });
});
```

### Integration Testing Controllers

Test controllers with a real DI container.

```typescript
// users.controller.test.ts
import { describe, test, expect } from "bun:test";
import { createTestingModule, createMock } from "kaheljs-test";
import { usersController } from "./users.controller";
import { UserService } from "./user.service";

describe("UsersController", () => {
  test("GET /users returns users", async () => {
    // Create test module
    const testModule = createTestingModule({
      controllers: [usersController],
      providers: [UserService.provider]
    });

    // Override UserService with mock using createMock for type safety
    testModule.override(UserService, createMock({
      findAll: () => [{ id: 1, name: "John" }]
    }));

    const app = testModule.createApp();

    // Test the route
    const res = await app.request("/users");
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.users).toHaveLength(1);
    expect(json.users[0].name).toBe("John");
  });
});
```

### E2E Testing

Test the complete application.

```typescript
// app.test.ts
import { describe, test, expect, beforeAll } from "bun:test";
import { createApp } from "kaheljs";
import { appModule } from "./app";

describe("E2E: Users API", () => {
  let app: Hono;

  beforeAll(() => {
    app = createApp(appModule);
  });

  test("GET /users returns all users", async () => {
    const res = await app.request("/users");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const json = await res.json();
    expect(json).toHaveProperty("users");
    expect(Array.isArray(json.users)).toBe(true);
  });

  test("POST /users creates a user", async () => {
    const res = await app.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "John Doe",
        email: "john@example.com"
      })
    });

    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.user).toHaveProperty("id");
    expect(json.user.name).toBe("John Doe");
  });

  test("GET /users/:id returns 404 for non-existent user", async () => {
    const res = await app.request("/users/99999");
    expect(res.status).toBe(404);
  });
});
```

### Test Utilities Reference

KahelJS provides comprehensive built-in test utilities via `kaheljs-test`:

```bash
bun add -d kaheljs-test
# or
npm install -D kaheljs-test
```

#### `createTestingModule(config)`

Create a test module with DI container for integration tests.

```typescript
import { createTestingModule } from "kaheljs-test";

const testModule = createTestingModule({
  controllers: [usersController],
  providers: [UserService.provider, DatabaseService.provider]
});

// Get service
const userService = testModule.get(UserService);

// Override service with mock
testModule.override(DatabaseService, mockDb);

// Create app for HTTP testing
const app = testModule.createApp();
```

#### `createMock<T>(implementation)`

Type-safe mock creation.

```typescript
import { createMock } from "kaheljs-test";

const mockDb = createMock<ReturnType<typeof DatabaseService.factory>>({
  query: async () => [{ id: 1, name: "John" }]
});

testModule.override(DatabaseService, mockDb);
```

#### `createMockFn<T>()`

Track function calls and mock return values.

```typescript
import { createMockFn } from "kaheljs-test";

const mockQuery = createMockFn<(sql: string) => Promise<any[]>>();

// Mock return values
mockQuery.mockResolvedValue([{ id: 1 }]);
mockQuery.mockRejectedValue(new Error("failed"));
mockQuery.mockReturnValue([{ id: 1 }]);
mockQuery.mockImplementation(async (sql) => []);

// Assert calls
expect(mockQuery.calls.length).toBe(1);
expect(mockQuery.calls[0]).toEqual(["SELECT * FROM users"]);
```

#### `createFactory(defaults)`

Generate test fixtures with auto-incrementing fields.

```typescript
import { createFactory } from "kaheljs-test";

const UserFactory = createFactory({
  id: 1,
  name: "Test User",
  email: "test@example.com"
});

const user = UserFactory.build();                    // { id: 1, ... }
const custom = UserFactory.build({ name: "Alice" }); // { id: 2, name: "Alice", ... }
const many = UserFactory.buildMany(5);               // Array of 5 users
UserFactory.reset();                                 // Reset counter
```

#### `request(app)`

Fluent HTTP request builder for testing.

```typescript
import { request } from "kaheljs-test";

// Simple GET
const res = await request(app).get("/users");

// POST with JSON
const res = await request(app)
  .post("/users")
  .json({ name: "John", email: "john@example.com" })
  .header("Authorization", "Bearer token");

// Custom method
const res = await request(app)
  .method("PATCH")
  .path("/users/1")
  .json({ name: "Jane" });
```

#### `testExpect`

HTTP assertion helpers.

```typescript
import { testExpect } from "kaheljs-test";

testExpect.status(res, 200);                    // Assert status code
testExpect.ok(res);                             // Assert 2xx status
testExpect.contentType(res, "application/json"); // Assert content type
testExpect.header(res, "X-Custom", "value");    // Assert header
await testExpect.json(res, { users: [...] });   // Assert JSON body
```

#### `spyOn(obj, method)`

Spy on existing functions while preserving behavior.

```typescript
import { spyOn } from "kaheljs-test";

const service = { findAll: () => [...] };
const spy = spyOn(service, "findAll");

service.findAll();

expect(spy.calls.length).toBe(1);
```

#### `waitFor(condition, timeout)`

Wait for async conditions.

```typescript
import { waitFor } from "kaheljs-test";

await waitFor(() => mockFn.calls.length > 0, 1000);
```

---

## Integration with Hono Ecosystem

KahelJS is designed to work seamlessly with the entire Hono ecosystem.

### OpenAPI

KahelJS is fully compatible with OpenAPI 3.0. We recommend using [Scalar](https://scalar.com/) for beautiful, modern API documentation.

```typescript
import { apiReference } from "@scalar/hono-api-reference";

// Create KahelJS app
const appModule = defineModule({
  controllers: [usersController]
});

const app = createApp(appModule);

// Define your OpenAPI spec
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "My API",
    version: "1.0.0"
  },
  paths: {
    "/users": {
      get: {
        summary: "List users",
        responses: {
          "200": {
            description: "User list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" }
        }
      }
    }
  }
};

// Serve OpenAPI spec
app.get("/openapi.json", (c) => c.json(openApiSpec));

// Serve Scalar documentation UI
app.get("/docs", apiReference({
  spec: { content: openApiSpec },
  theme: "purple"
}));
```

**See the [with-openapi example](./apps/with-openapi) for a complete implementation with Scalar.**

For type-safe OpenAPI with schema validation, use [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi).

### CORS

```typescript
import { cors } from "hono/cors";

const app = createApp(appModule);

app.use("*", cors({
  origin: ["https://example.com", "https://app.example.com"],
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400
}));
```

### JWT Authentication

```typescript
import { jwt } from "hono/jwt";

const app = createApp(appModule);

// Protect all /api routes
app.use("/api/*", jwt({
  secret: process.env.JWT_SECRET!
}));

// In controller, access JWT payload
const protectedController = defineController("/api/protected", (r, deps) => {
  r.get("/", (c) => {
    const payload = c.get("jwtPayload");
    return c.json({ user: payload.sub });
  });
});
```

### Rate Limiting

```typescript
import { rateLimiter } from "hono-rate-limiter";

const app = createApp(appModule);

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Max 100 requests per windowMs
  standardHeaders: "draft-6",
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "anonymous"
});

app.use("/api/*", limiter);
```

---

## Performance

### Zero Runtime Overhead

KahelJS resolves all dependencies at **startup time**, not request time:

```typescript
// At startup (happens once):
const module = defineModule({
  controllers: [usersController],
  providers: [UserService.provider]
});

// DI resolution happens here ↑
const app = createApp(module);

// At request time (zero DI overhead):
app.request("/users");  // Pure Hono performance!
```

### Performance Tips

1. **Use singleton lifetime (default)** - Services instantiated once
2. **Avoid transient services in hot paths** - Only use when needed
3. **Resolve services once in controllers** - Not per-request
4. **Use Hono's built-in features** - Routing, middleware, etc.

```typescript
// ✅ Good: Resolve once at controller creation
const usersController = defineController("/users", (r, deps) => {
  const userService = deps.get(UserService);  // Once

  r.get("/", (c) => {
    return c.json({ users: userService.findAll() });
  });
});

// ❌ Bad: Don't do this
const usersController = defineController("/users", (r, deps) => {
  r.get("/", (c) => {
    const userService = deps.get(UserService);  // Every request!
    return c.json({ users: userService.findAll() });
  });
});
```

---

## Architecture

### How It Works

1. **Define services** with `defineInjectable()` - Creates factory functions
2. **Define controllers** with `defineController()` - Route definitions
3. **Define modules** with `defineModule()` - Groups controllers + providers
4. **Bootstrap app** with `createApp()` - Compiles to pure Hono

```
┌─────────────────────────────────────────────┐
│ At Startup (Compile Time)                  │
├─────────────────────────────────────────────┤
│ 1. Create DI Container                      │
│ 2. Register all providers                   │
│ 3. Resolve all dependencies                 │
│ 4. Instantiate all controllers              │
│ 5. Compile routes to Hono app               │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ At Request Time (Pure Hono)                │
├─────────────────────────────────────────────┤
│ 1. Hono router matches route                │
│ 2. Middleware chain executes                │
│ 3. Handler executes (no DI lookup)          │
│ 4. Response sent                            │
└─────────────────────────────────────────────┘
```

### Design Principles

1. **Functional over OOP** - Functions, not classes
2. **Compile-time DI** - Zero runtime overhead
3. **Type inference** - Minimal type annotations
4. **Hono compatibility** - Use any Hono feature
5. **Developer experience** - NestJS-like organization

---

## API Reference

### `defineInjectable()`

Create a functional service with dependency injection.

```typescript
// Signature 1: No dependencies
defineInjectable<TFactory extends () => any>(
  factory: TFactory
): Injectable<ReturnType<TFactory>>

// Signature 2: With dependencies
defineInjectable<TDeps, TFactory>(
  factory: TFactory,
  deps: TDeps
): Injectable<ReturnType<TFactory>>

// Signature 3: Config object
defineInjectable<TDeps, TFactory>(
  config: {
    name: string;
    factory: TFactory;
    deps?: TDeps;
    lifetime?: "singleton" | "transient";
  }
): Injectable<ReturnType<TFactory>>
```

### `defineController()`

Create a controller with routes.

```typescript
defineController(
  prefix: string,
  setup: (r: RouteBuilder, deps: DIContainer) => void
): ControllerFactory
```

**RouteBuilder methods:**
- `r.get(path, ...handlers)` - GET route
- `r.post(path, ...handlers)` - POST route
- `r.put(path, ...handlers)` - PUT route
- `r.delete(path, ...handlers)` - DELETE route
- `r.patch(path, ...handlers)` - PATCH route
- `r.options(path, ...handlers)` - OPTIONS route

### `defineModule()`

Create a module to organize controllers and services.

```typescript
defineModule(config: {
  controllers?: ControllerFactory[];
  providers?: Provider[];
  imports?: ModuleDefinition[];
  exports?: Token[];
}): ModuleDefinition
```

### `createApp()`

Bootstrap the application.

```typescript
createApp<E extends Env = Env>(
  rootModule: ModuleDefinition,
  options?: HonoOptions<E>
): Hono<E>
```

### `DIContainer`

Manual dependency injection container.

```typescript
class DIContainer {
  register<T>(provider: Provider<T>): void
  registerMany(providers: Provider[]): void
  registerValue<T>(token: Token<T>, value: T): void
  registerClass<T>(token: Token<T>, useClass: Constructor<T>, options?): void
  registerFactory<T>(token: Token<T>, useFactory: Function, options?): void
  get<T>(token: Token<T> | Injectable<T>): T
  has(token: Token | Injectable): boolean
  createChild(): DIContainer
}
```

---

## License

MIT

---

**Built with ❤️ for the Hono community**

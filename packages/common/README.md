# kaheljs

Core package for KahelJS - A zero-overhead, NestJS-style framework for Hono with functional patterns and type-safe dependency injection.

## Installation

```bash
bun add kaheljs hono
# or
npm install kaheljs hono
```

## Quick Start

```typescript
import { defineInjectable, defineController, defineModule, createApp } from "kaheljs";

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

Bun.serve({
  port: 3000,
  fetch: app.fetch
});
```

## Core Exports

### Functions
- `defineInjectable()` - Create functional services with DI
- `defineController()` - Define HTTP route controllers
- `defineModule()` - Organize controllers and providers
- `createApp()` - Bootstrap the Hono application
- `DIContainer` - Manual dependency injection container

### Types
- `Injectable<T>` - Injectable service type
- `ModuleDefinition` - Module definition type
- `ModuleConfig` - Module configuration type
- `Provider` - DI provider types
- `Token` - DI token types

## Documentation

For complete documentation, examples, and guides, see the [main KahelJS documentation](../../README.md).

## Features

- ✅ **Zero Runtime Overhead** - All DI resolved at startup, pure Hono performance
- ✅ **Functional Pattern** - No classes or decorators required
- ✅ **Type-Safe DI** - Full TypeScript inference for dependencies
- ✅ **Module System** - Organize code with imports/exports like NestJS
- ✅ **100% Hono Compatible** - Use any Hono middleware seamlessly

## Testing

For testing utilities, install `kaheljs-test`:

```bash
bun add -d kaheljs-test
```

## License

MIT

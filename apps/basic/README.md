# Basic Example

A minimal KahelJS application demonstrating the core concepts.

## Features

- ✅ Simple service with no dependencies
- ✅ Controller with multiple routes
- ✅ Dependency injection
- ✅ Module setup

## Running

```bash
# Install dependencies (from root)
bun install

# Run in development mode (with hot reload)
bun run dev

# Run in production mode
bun run start
```

## Routes

- `GET /` - Returns a greeting and app info
- `GET /greet/:name` - Returns a personalized greeting
- `GET /health` - Health check endpoint

## Example Requests

```bash
# Get default greeting
curl http://localhost:3000/

# Get personalized greeting
curl http://localhost:3000/greet/John

# Health check
curl http://localhost:3000/health
```

## What You'll Learn

1. **Creating Services**: Use `defineInjectable` to create reusable services
2. **Defining Controllers**: Use `defineController` to group related routes
3. **Dependency Injection**: Access services via `deps.get()` inside route handlers
4. **Module Setup**: Use `defineModule` to organize your application
5. **App Bootstrap**: Use `createApp` to create a Hono server

## Code Structure

```
src/
  ├── greeting.service.ts      # Business logic (service layer)
  ├── greeting.controller.ts   # HTTP routes (controller layer)
  ├── index.ts                 # Application bootstrap
  └── index.test.ts            # Comprehensive tests
```

## Testing

This example includes comprehensive tests demonstrating:

```bash
# Run tests
bun test

# Watch mode
bun test --watch
```

**Test coverage includes:**
- ✅ Service isolation tests
- ✅ Controller integration tests
- ✅ Mocked service tests
- ✅ Error handling tests
- ✅ HTTP request/response tests

**Example test:**
```typescript
test("GreetingService returns correct greeting", () => {
  const service = GreetingService.factory();
  expect(service.getGreeting("John")).toBe("Hello, John!");
});
```

See `src/index.test.ts` for full test suite.

## Next Steps

Check out other examples:
- **todo-api** - CRUD operations with in-memory storage
- **multi-module** - Module composition and imports/exports
- **with-middleware** - Middleware patterns (auth, logging)

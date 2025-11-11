# @kaheljs/test

Testing utilities for KahelJS - the zero-overhead, NestJS-style framework for Hono.

## Installation

```bash
bun add -d @kaheljs/test
# or
npm install -D @kaheljs/test
```

## Quick Start

```typescript
import { describe, test, expect } from "bun:test";
import { createTestingModule, createMock, request } from "@kaheljs/test";

describe("UsersController", () => {
  test("GET /users returns users", async () => {
    const testModule = createTestingModule({
      controllers: [usersController],
      providers: [UserService.provider]
    });

    // Mock a service
    testModule.override(DatabaseService, createMock({
      query: async () => [{ id: 1, name: "John" }]
    }));

    // Create app and test
    const app = testModule.createApp();
    const res = await request(app).get("/users");

    expect(res.status).toBe(200);
  });
});
```

## Available Utilities

### `createTestingModule(config)`
Create test modules with dependency injection

### `createMock<T>(implementation)`
Type-safe mocks for services

### `createMockFn<T>()`
Track function calls with `.calls` and `.results`

### `createFactory(defaults)`
Generate test fixtures with auto-incrementing fields

### `request(app)`
Fluent API for HTTP requests

### `testExpect`
HTTP assertion helpers (`.status()`, `.json()`, `.header()`, etc.)

### `spyOn(obj, method)`
Spy on existing functions

### `waitFor(condition, timeout)`
Wait for async conditions

## Documentation

See the [main KahelJS documentation](../../README.md#testing) for complete testing guide.

## License

MIT

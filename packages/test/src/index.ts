import type { Hono } from "hono";
import { DIContainer, defineModule, createApp } from "@kaheljs/common";
import type { ModuleConfig, ModuleDefinition, InjectableToken, KahelApp } from "@kaheljs/common";

/**
 * Testing module interface with utilities for testing
 *
 * @public
 */
export interface TestingModule {
  /** The module definition */
  module: ModuleDefinition;

  /** The DI container */
  container: DIContainer;

  /**
   * Get a service from the container
   *
   * @param token - Service token or Injectable
   * @returns The resolved service instance
   */
  get<T>(token: InjectableToken<T>): T;

  /**
   * Override a service with a mock implementation
   *
   * @param token - Service token or Injectable to override
   * @param value - Mock implementation that matches the service interface
   *
   * @remarks
   * For type-safe mocking, use createMock() to create compatible mocks:
   * ```typescript
   * testModule.override(MyService, createMock<MyServiceType>({
   *   method: () => "mocked value"
   * }));
   * ```
   */
  override<T, TMock extends T = T>(token: InjectableToken<T>, value: TMock): void;

  /**
   * Create a Hono app from the testing module
   *
   * @returns Hono application instance
   */
  createApp(): KahelApp;
}

/**
 * Creates a testing module for integration tests
 *
 * @param config - Module configuration
 * @returns TestingModule with utilities for testing
 *
 * @remarks
 * TestingModule provides:
 * - Service resolution via `get()`
 * - Service mocking via `override()`
 * - App creation via `createApp()`
 * - Access to the DI container
 *
 * @example
 * ```typescript
 * const testing = createTestingModule({
 *   controllers: [usersController],
 *   providers: [UserService.provider, DatabaseService.provider]
 * });
 *
 * // Override a service with a mock
 * testing.override(DatabaseService, {
 *   query: () => [{ id: 1, name: "John" }]
 * });
 *
 * // Get service for assertions
 * const userService = testing.get(UserService);
 *
 * // Create app for HTTP testing
 * const app = testing.createApp();
 * const res = await app.request("/users");
 * ```
 *
 * @public
 */
export function createTestingModule(config: ModuleConfig): TestingModule {
  const module = defineModule(config);

  return {
    module,
    container: module.container,

    get<T>(token: InjectableToken<T>): T {
      return module.container.get(token);
    },

    override<T, TMock extends T = T>(token: InjectableToken<T>, value: TMock): void {
      module.container.registerValue(token, value);
    },

    createApp() {
      return createApp(module);
    }
  };
}

/**
 * Creates a mock implementation for an Injectable
 *
 * @param implementation - Partial or full mock implementation
 * @returns Mock object that can be used with override()
 *
 * @remarks
 * This is a type-safe way to create mocks. You can provide a partial
 * implementation and TypeScript will ensure the types match.
 *
 * @example
 * ```typescript
 * const UserService = defineInjectable(() => ({
 *   findAll: () => [...],
 *   findById: (id: number) => ...,
 *   create: (data: any) => ...
 * }));
 *
 * // Create a mock with only the methods you need
 * const mockUserService = createMock<typeof UserService>({
 *   findAll: () => [{ id: 1, name: "John" }],
 *   findById: (id) => ({ id, name: "John" })
 *   // create is optional - will be undefined if not provided
 * });
 *
 * testing.override(UserService, mockUserService);
 * ```
 *
 * @public
 */
export function createMock<T>(implementation: Partial<T>): T {
  return implementation as T;
}

/**
 * HTTP response assertion helpers
 *
 * @public
 */
export const expect = {
  /**
   * Assert response status code
   */
  status(response: Response, expected: number): void {
    if (response.status !== expected) {
      throw new Error(
        `Expected status ${expected}, got ${response.status}`
      );
    }
  },

  /**
   * Assert response JSON matches expected value
   */
  async json(response: Response, expected: any): Promise<void> {
    const actual = await response.json();
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr !== expectedStr) {
      throw new Error(
        `Expected JSON:\n${expectedStr}\n\nGot:\n${actualStr}`
      );
    }
  },

  /**
   * Assert response has specific header
   */
  header(response: Response, name: string, expected?: string): void {
    const actual = response.headers.get(name);

    if (expected !== undefined && actual !== expected) {
      throw new Error(
        `Expected header "${name}" to be "${expected}", got "${actual}"`
      );
    } else if (expected === undefined && !actual) {
      throw new Error(`Expected header "${name}" to exist`);
    }
  },

  /**
   * Assert response content type
   */
  contentType(response: Response, expected: string): void {
    const actual = response.headers.get("content-type");

    if (!actual || !actual.includes(expected)) {
      throw new Error(
        `Expected content-type to include "${expected}", got "${actual}"`
      );
    }
  },

  /**
   * Assert response is successful (2xx)
   */
  ok(response: Response): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Expected successful response (2xx), got ${response.status}`
      );
    }
  }
};

/**
 * HTTP request builder for testing
 *
 * @remarks
 * Provides a fluent API for building test requests
 *
 * @example
 * ```typescript
 * const app = testing.createApp();
 *
 * // Simple GET
 * const res = await request(app).get("/users");
 *
 * // POST with JSON body
 * const res = await request(app)
 *   .post("/users")
 *   .json({ name: "John", email: "john@example.com" })
 *   .header("Authorization", "Bearer token");
 *
 * // Custom request
 * const res = await request(app)
 *   .method("PATCH")
 *   .path("/users/1")
 *   .json({ name: "Jane" });
 * ```
 *
 * @public
 */
export function request(app: KahelApp | Hono) {
  let method = "GET";
  let path = "/";
  const headers: Record<string, string> = {};
  let body: any = undefined;

  const builder = {
    get(p: string) {
      method = "GET";
      path = p;
      return builder;
    },

    post(p: string) {
      method = "POST";
      path = p;
      return builder;
    },

    put(p: string) {
      method = "PUT";
      path = p;
      return builder;
    },

    delete(p: string) {
      method = "DELETE";
      path = p;
      return builder;
    },

    patch(p: string) {
      method = "PATCH";
      path = p;
      return builder;
    },

    method(m: string) {
      method = m;
      return builder;
    },

    path(p: string) {
      path = p;
      return builder;
    },

    header(name: string, value: string) {
      headers[name] = value;
      return builder;
    },

    json(data: any) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
      return builder;
    },

    form(data: Record<string, string>) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(data).toString();
      return builder;
    },

    body(data: any) {
      body = data;
      return builder;
    },

    async send(): Promise<Response> {
      return await app.request(path, {
        method,
        headers,
        body
      });
    },

    then(resolve: (res: Response) => any, reject?: (err: any) => any) {
      return this.send().then(resolve, reject);
    }
  };

  return builder;
}

/**
 * Fixture factory utilities
 *
 * @remarks
 * Helpers for creating test data
 *
 * @example
 * ```typescript
 * const UserFactory = createFactory({
 *   id: 1,
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 *
 * const user1 = UserFactory.build();
 * const user2 = UserFactory.build({ name: "Jane" });
 * const users = UserFactory.buildMany(5);
 * ```
 *
 * @public
 */
export function createFactory<T extends Record<string, any>>(defaults: T) {
  let sequence = 0;

  return {
    /**
     * Build a single fixture with optional overrides
     */
    build(overrides?: Partial<T>): T {
      sequence++;
      const sequenceData = {} as any;

      // Auto-increment numeric fields
      for (const key in defaults) {
        if (typeof defaults[key] === "number") {
          sequenceData[key] = sequence;
        }
      }

      return {
        ...defaults,
        ...sequenceData,
        ...overrides
      };
    },

    /**
     * Build multiple fixtures
     */
    buildMany(count: number, overrides?: Partial<T>): T[] {
      return Array.from({ length: count }, () => this.build(overrides));
    },

    /**
     * Reset the sequence counter
     */
    reset() {
      sequence = 0;
    }
  };
}

/**
 * Mock function utility
 *
 * @remarks
 * Creates a mock function that tracks calls and allows assertions
 *
 * @example
 * ```typescript
 * const mockFn = createMockFn<(id: number) => User>();
 * mockFn.mockReturnValue({ id: 1, name: "John" });
 *
 * testing.override(UserService, {
 *   findById: mockFn
 * });
 *
 * // Call the function
 * const user = userService.findById(1);
 *
 * // Assert it was called
 * expect(mockFn.calls.length).toBe(1);
 * expect(mockFn.calls[0]).toEqual([1]);
 * ```
 *
 * @public
 */
export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  calls: Parameters<T>[];
  results: ReturnType<T>[];
  mockReturnValue(value: ReturnType<T>): MockFunction<T>;
  mockImplementation(fn: T): MockFunction<T>;
  mockResolvedValue(value: Awaited<ReturnType<T>>): MockFunction<T>;
  mockRejectedValue(error: any): MockFunction<T>;
  clear(): void;
}

/**
 * Creates a mock function
 *
 * @returns Mock function with tracking and assertions
 *
 * @public
 */
export function createMockFn<T extends (...args: any[]) => any>(): MockFunction<T> {
  const calls: Parameters<T>[] = [];
  const results: ReturnType<T>[] = [];
  let implementation: T | undefined;
  let returnValue: ReturnType<T> | undefined;
  let resolvedValue: Awaited<ReturnType<T>> | undefined;
  let rejectedValue: any;

  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args);

    if (implementation) {
      const result = implementation(...args);
      results.push(result);
      return result;
    }

    if (resolvedValue !== undefined) {
      const promise = Promise.resolve(resolvedValue);
      results.push(promise as any);
      return promise;
    }

    if (rejectedValue !== undefined) {
      const promise = Promise.reject(rejectedValue);
      results.push(promise as any);
      return promise;
    }

    if (returnValue !== undefined) {
      results.push(returnValue);
      return returnValue;
    }

    results.push(undefined as any);
    return undefined;
  }) as MockFunction<T>;

  mockFn.calls = calls;
  mockFn.results = results;

  mockFn.mockReturnValue = (value: ReturnType<T>) => {
    returnValue = value;
    return mockFn;
  };

  mockFn.mockImplementation = (fn: T) => {
    implementation = fn;
    return mockFn;
  };

  mockFn.mockResolvedValue = (value: Awaited<ReturnType<T>>) => {
    resolvedValue = value;
    return mockFn;
  };

  mockFn.mockRejectedValue = (error: any) => {
    rejectedValue = error;
    return mockFn;
  };

  mockFn.clear = () => {
    calls.length = 0;
    results.length = 0;
    implementation = undefined;
    returnValue = undefined;
    resolvedValue = undefined;
    rejectedValue = undefined;
  };

  return mockFn;
}

/**
 * Spy on an existing function
 *
 * @param obj - Object containing the method
 * @param methodName - Method name to spy on
 * @returns Mock function that wraps the original
 *
 * @remarks
 * Creates a spy that tracks calls while preserving original behavior
 *
 * @example
 * ```typescript
 * const service = { findById: (id: number) => ({ id, name: "John" }) };
 * const spy = spyOn(service, "findById");
 *
 * service.findById(1);
 *
 * expect(spy.calls.length).toBe(1);
 * expect(spy.calls[0]).toEqual([1]);
 * ```
 *
 * @public
 */
export function spyOn<T extends object, K extends keyof T>(
  obj: T,
  methodName: K
): T[K] extends (...args: any[]) => any ? MockFunction<T[K]> : never {
  const original = obj[methodName] as any;
  const mockFn = createMockFn<any>();

  mockFn.mockImplementation(original);

  // Replace the method
  (obj as any)[methodName] = mockFn;

  return mockFn as any;
}

/**
 * Wait for a condition to be true
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in milliseconds
 * @param interval - Check interval in milliseconds
 *
 * @remarks
 * Useful for testing asynchronous operations
 *
 * @example
 * ```typescript
 * await waitFor(() => mockFn.calls.length > 0, 1000);
 * ```
 *
 * @public
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

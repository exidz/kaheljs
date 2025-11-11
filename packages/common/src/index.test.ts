/**
 * Comprehensive test suite for @kaheljs/common
 *
 * These tests verify all core functionality of the framework including:
 * - Service definition with defineInjectable
 * - Controller creation with defineController
 * - Module organization with defineModule
 * - Dependency injection with DIContainer
 * - End-to-end request handling
 */

import { describe, test, expect } from "bun:test";
import {
  defineInjectable,
  defineController,
  defineModule,
  createApp,
  DIContainer
} from "./index";

describe("@kaheljs/common - Core Framework Tests", () => {
  /**
   * Test: defineInjectable creates a functional service
   *
   * Verifies that defineInjectable:
   * - Returns a valid Injectable object
   * - Creates a unique symbol token
   * - Includes provider configuration
   * - Supports explicit naming via config object
   */
  test("defineInjectable creates service with metadata", () => {
    // Use config object syntax to explicitly name the service
    const TestService = defineInjectable({
      name: "TestService",
      factory: () => ({
        getValue: () => "test",
        calculate: (x: number) => x * 2
      })
    });

    expect(TestService).toBeDefined();
    expect(TestService.token).toBeTypeOf("symbol");
    expect(TestService.name).toBe("TestService");
    expect(TestService.provider).toBeDefined();
    expect(TestService.provider.provide).toBe(TestService.token);
    expect(TestService.provider.useFactory).toBeTypeOf("function");
  });

  /**
   * Test: defineInjectable with dependencies
   *
   * Verifies that services can depend on other services and
   * the dependency array is properly stored
   */
  test("defineInjectable with dependencies", () => {
    const ServiceA = defineInjectable(() => ({ name: "A" }));

    const ServiceB = defineInjectable(
      (a) => ({
        name: "B",
        getDependencyName: () => a.name
      }),
      [ServiceA] as const
    );

    expect(ServiceB.deps).toHaveLength(1);
    expect(ServiceB.deps[0]).toBe(ServiceA);
  });

  /**
   * Test: defineController creates route handler
   *
   * Verifies that controllers:
   * - Are created with the correct prefix
   * - Have a Hono app instance
   * - Can define routes
   */
  test("defineController creates controller with routes", () => {
    const controller = defineController("/api/test", (r) => {
      r.get("/", (c) => c.json({ message: "test" }));
      r.post("/", (c) => c.json({ created: true }, 201));
    });

    expect(controller).toBeDefined();
    expect(controller.prefix).toBe("/api/test");
    expect(controller.app).toBeDefined();
    expect(controller.app.routes).toBeDefined();
  });

  /**
   * Test: defineModule organizes application structure
   *
   * Verifies that modules:
   * - Create a DI container
   * - Register providers
   * - Instantiate controllers
   */
  test("defineModule creates module with DI container", () => {
    const TestService = defineInjectable(() => ({ test: true }));

    const testController = defineController("/test", (r) => {
      r.get("/", (c) => c.json({ ok: true }));
    });

    const module = defineModule({
      controllers: [testController],
      providers: [TestService.provider]
    });

    expect(module).toBeDefined();
    expect(module.container).toBeInstanceOf(DIContainer);
    expect(module.controllers).toBeArray();
    expect(module.controllers).toHaveLength(1);
    expect(module.providers).toBeArray();
    expect(module.providers).toHaveLength(1);
  });

  /**
   * Test: createApp bootstraps Hono application
   *
   * Verifies that createApp:
   * - Returns a Hono application
   * - Mounts all controllers
   * - Has a working fetch function
   */
  test("createApp creates Hono app from module", () => {
    const testController = defineController("/api", (r) => {
      r.get("/status", (c) => c.json({ status: "ok" }));
    });

    const module = defineModule({
      controllers: [testController]
    });

    const app = createApp(module);

    expect(app).toBeDefined();
    expect(app.fetch).toBeTypeOf("function");
    expect(app.routes).toBeDefined();
  });

  /**
   * Test: DI container resolves dependencies
   *
   * Verifies that:
   * - Services are resolved correctly
   * - Dependencies are injected automatically
   * - The full dependency chain works
   */
  test("DI container resolves dependency chain", () => {
    const container = new DIContainer();

    const ServiceA = defineInjectable(() => ({
      name: "A",
      getValue: () => "valueA"
    }));

    const ServiceB = defineInjectable(
      (a) => ({
        name: "B",
        getDependency: () => a.getValue()
      }),
      [ServiceA] as const
    );

    // Register providers
    container.register(ServiceA.provider);
    container.register(ServiceB.provider);

    // Resolve ServiceB (should automatically resolve ServiceA)
    const serviceB = container.get(ServiceB);

    expect(serviceB.name).toBe("B");
    expect(serviceB.getDependency()).toBe("valueA");
  });

  /**
   * Test: Module imports and exports
   *
   * Verifies that:
   * - Modules can import other modules
   * - Exported services are available to importing modules
   * - Service instances are shared (singleton)
   */
  test("Modules can import and export services", () => {
    const SharedService = defineInjectable(() => ({
      sharedValue: "shared"
    }));

    // Module A exports SharedService
    const moduleA = defineModule({
      providers: [SharedService.provider],
      exports: [SharedService]
    });

    const ConsumerService = defineInjectable(
      (shared) => ({
        getShared: () => shared.sharedValue
      }),
      [SharedService] as const
    );

    // Module B imports Module A and uses SharedService
    const moduleB = defineModule({
      imports: [moduleA],
      providers: [ConsumerService.provider]
    });

    // Verify ConsumerService can access SharedService
    const consumer = moduleB.container.get(ConsumerService);
    expect(consumer.getShared()).toBe("shared");
  });

  /**
   * Test: End-to-end HTTP request handling
   *
   * Verifies the complete flow:
   * 1. Service creation
   * 2. Controller definition
   * 3. Module assembly
   * 4. App creation
   * 5. HTTP request handling
   */
  test("End-to-end: HTTP request with DI", async () => {
    // Define a service
    const UserService = defineInjectable(() => ({
      getUsers: () => [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" }
      ],
      getUserById: (id: number) => {
        const users = [
          { id: 1, name: "John" },
          { id: 2, name: "Jane" }
        ];
        return users.find(u => u.id === id);
      }
    }));

    // Define a controller that uses the service
    // IMPORTANT: Access deps.get() inside route handlers, not at setup level
    const usersController = defineController("/users", (r, deps) => {
      r.get("/", (c) => {
        const userService = deps.get(UserService);
        return c.json({ users: userService.getUsers() });
      });

      r.get("/:id", (c) => {
        const userService = deps.get(UserService);
        const id = Number(c.req.param("id"));
        const user = userService.getUserById(id);

        if (!user) {
          return c.json({ error: "Not found" }, 404);
        }

        return c.json({ user });
      });
    });

    // Create module with controller and service
    const appModule = defineModule({
      controllers: [usersController],
      providers: [UserService.provider]
    });

    // Bootstrap app
    const app = createApp(appModule);

    // Test GET /users
    const listRes = await app.request("/users");
    expect(listRes.status).toBe(200);

    const listJson = await listRes.json();
    expect(listJson.users).toBeArray();
    expect(listJson.users).toHaveLength(2);
    expect(listJson.users[0].name).toBe("John");

    // Test GET /users/1
    const singleRes = await app.request("/users/1");
    expect(singleRes.status).toBe(200);

    const singleJson = await singleRes.json();
    expect(singleJson.user.id).toBe(1);
    expect(singleJson.user.name).toBe("John");

    // Test GET /users/999 (not found)
    const notFoundRes = await app.request("/users/999");
    expect(notFoundRes.status).toBe(404);
  });

  /**
   * Test: Multiple HTTP methods
   *
   * Verifies that controllers support all HTTP methods
   */
  test("Controller supports all HTTP methods", async () => {
    const dataController = defineController("/data", (r) => {
      r.get("/", (c) => c.json({ method: "GET" }));
      r.post("/", (c) => c.json({ method: "POST" }, 201));
      r.put("/", (c) => c.json({ method: "PUT" }));
      r.delete("/", (c) => c.json({ method: "DELETE" }));
      r.patch("/", (c) => c.json({ method: "PATCH" }));
      r.options("/", (c) => c.json({ method: "OPTIONS" }));
    });

    const module = defineModule({
      controllers: [dataController]
    });

    const app = createApp(module);

    // Test each HTTP method
    const getRes = await app.request("/data", { method: "GET" });
    expect((await getRes.json()).method).toBe("GET");

    const postRes = await app.request("/data", { method: "POST" });
    expect((await postRes.json()).method).toBe("POST");

    const putRes = await app.request("/data", { method: "PUT" });
    expect((await putRes.json()).method).toBe("PUT");

    const deleteRes = await app.request("/data", { method: "DELETE" });
    expect((await deleteRes.json()).method).toBe("DELETE");

    const patchRes = await app.request("/data", { method: "PATCH" });
    expect((await patchRes.json()).method).toBe("PATCH");

    const optionsRes = await app.request("/data", { method: "OPTIONS" });
    expect((await optionsRes.json()).method).toBe("OPTIONS");
  });

  /**
   * Test: Request body parsing
   *
   * Verifies that request bodies can be parsed in route handlers
   */
  test("POST request with JSON body", async () => {
    const apiController = defineController("/api", (r) => {
      r.post("/echo", async (c) => {
        const body = await c.req.json();
        return c.json({ received: body });
      });
    });

    const module = defineModule({
      controllers: [apiController]
    });

    const app = createApp(module);

    const res = await app.request("/api/echo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello", value: 42 })
    });

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received.message).toBe("hello");
    expect(json.received.value).toBe(42);
  });

  /**
   * Test: Circular dependency detection
   *
   * Verifies that circular dependencies are detected and reported with a helpful error message
   */
  test("DI container detects circular dependencies", () => {
    const container = new DIContainer();

    // Create circular dependency: A -> B -> A using symbol tokens
    const tokenA = Symbol("ServiceA");
    const tokenB = Symbol("ServiceB");

    // ServiceA depends on ServiceB
    container.register({
      provide: tokenA,
      useFactory: (b: any) => ({ name: "A", dep: b }),
      deps: [tokenB]
    });

    // ServiceB depends on ServiceA (creates circular dependency)
    container.register({
      provide: tokenB,
      useFactory: (a: any) => ({ name: "B", dep: a }),
      deps: [tokenA]
    });

    // This should throw an error about circular dependency
    expect(() => {
      container.get(tokenA);
    }).toThrow(/Circular dependency detected/);
  });

  /**
   * Test: Module with comprehensive metadata
   *
   * Verifies that modules correctly store and expose all metadata:
   * - Providers array
   * - Controllers array
   * - Imports array
   * - Exports array
   * - DI container instance
   */
  test("Module stores complete metadata", () => {
    const ServiceA = defineInjectable(() => ({ value: "A" }));
    const ServiceB = defineInjectable(() => ({ value: "B" }));

    const controller1 = defineController("/api/v1", (r) => {
      r.get("/", (c) => c.json({ version: 1 }));
    });

    const controller2 = defineController("/api/v2", (r) => {
      r.get("/", (c) => c.json({ version: 2 }));
    });

    const importedModule = defineModule({
      providers: [ServiceA.provider],
      exports: [ServiceA]
    });

    const module = defineModule({
      controllers: [controller1, controller2],
      providers: [ServiceB.provider],
      imports: [importedModule],
      exports: [ServiceB]
    });

    // Verify controllers metadata
    expect(module.controllers).toBeArray();
    expect(module.controllers).toHaveLength(2);
    expect(module.controllers[0]!.prefix).toBe("/api/v1");
    expect(module.controllers[0]!.app).toBeDefined();
    expect(module.controllers[1]!.prefix).toBe("/api/v2");
    expect(module.controllers[1]!.app).toBeDefined();

    // Verify providers metadata
    expect(module.providers).toBeArray();
    expect(module.providers).toHaveLength(1);
    expect(module.providers[0]).toBe(ServiceB.provider);

    // Verify imports metadata
    expect(module.imports).toBeArray();
    expect(module.imports).toHaveLength(1);
    expect(module.imports[0]).toBe(importedModule);

    // Verify exports metadata
    expect(module.exports).toBeArray();
    expect(module.exports).toHaveLength(1);
    expect(module.exports[0]).toBe(ServiceB);

    // Verify DI container exists
    expect(module.container).toBeInstanceOf(DIContainer);
  });

  /**
   * Test: Singleton vs Transient lifecycle
   *
   * Verifies that:
   * - Singleton services return the same instance
   * - Transient services return new instances each time
   * - Instances are properly managed by the container
   */
  test("Service lifecycle: singleton vs transient", () => {
    const container = new DIContainer();

    // Create singleton service (default)
    const SingletonService = defineInjectable({
      name: "SingletonService",
      factory: () => ({ id: Math.random() }),
      lifetime: "singleton"
    });

    // Create transient service
    const TransientService = defineInjectable({
      name: "TransientService",
      factory: () => ({ id: Math.random() }),
      lifetime: "transient"
    });

    container.register(SingletonService.provider);
    container.register(TransientService.provider);

    // Test singleton: same instance every time
    const singleton1 = container.get(SingletonService);
    const singleton2 = container.get(SingletonService);
    expect(singleton1).toBe(singleton2);
    expect(singleton1.id).toBe(singleton2.id);

    // Test transient: different instance every time
    const transient1 = container.get(TransientService);
    const transient2 = container.get(TransientService);
    expect(transient1).not.toBe(transient2);
    expect(transient1.id).not.toBe(transient2.id);
  });

  /**
   * Test: Controller with service dependencies
   *
   * Verifies that controllers can inject and use services:
   * - Services are available via deps.get()
   * - Multiple services can be injected
   * - Services work correctly in route handlers
   */
  test("Controller with multiple service dependencies", async () => {
    const ConfigService = defineInjectable(() => ({
      apiPrefix: "/api/v1",
      maxResults: 10
    }));

    const DataService = defineInjectable(() => ({
      getData: () => Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }))
    }));

    const apiController = defineController("/data", (r, deps) => {
      r.get("/", (c) => {
        const config = deps.get(ConfigService);
        const data = deps.get(DataService);

        return c.json({
          prefix: config.apiPrefix,
          items: data.getData().slice(0, config.maxResults)
        });
      });
    });

    const module = defineModule({
      controllers: [apiController],
      providers: [ConfigService.provider, DataService.provider]
    });

    const app = createApp(module);
    const res = await app.request("/data");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.prefix).toBe("/api/v1");
    expect(json.items).toHaveLength(5);
    expect(json.items[0].id).toBe(1);
  });

  /**
   * Test: Deep dependency chain resolution
   *
   * Verifies that:
   * - Dependencies are resolved recursively
   * - Deep chains (A -> B -> C -> D) work correctly
   * - All dependencies are properly instantiated
   */
  test("DI resolves deep dependency chains", () => {
    const container = new DIContainer();

    const ServiceD = defineInjectable(() => ({
      name: "D",
      level: 4
    }));

    const ServiceC = defineInjectable(
      (d) => ({
        name: "C",
        level: 3,
        child: d
      }),
      [ServiceD] as const
    );

    const ServiceB = defineInjectable(
      (c) => ({
        name: "B",
        level: 2,
        child: c
      }),
      [ServiceC] as const
    );

    const ServiceA = defineInjectable(
      (b) => ({
        name: "A",
        level: 1,
        child: b
      }),
      [ServiceB] as const
    );

    container.register(ServiceD.provider);
    container.register(ServiceC.provider);
    container.register(ServiceB.provider);
    container.register(ServiceA.provider);

    const serviceA = container.get(ServiceA);

    expect(serviceA.name).toBe("A");
    expect(serviceA.level).toBe(1);
    expect(serviceA.child.name).toBe("B");
    expect(serviceA.child.level).toBe(2);
    expect(serviceA.child.child.name).toBe("C");
    expect(serviceA.child.child.level).toBe(3);
    expect(serviceA.child.child.child.name).toBe("D");
    expect(serviceA.child.child.child.level).toBe(4);
  });

  /**
   * Test: Missing provider error handling
   *
   * Verifies that:
   * - Clear error messages for missing providers
   * - Error includes dependency chain context
   * - Helpful suggestions for fixing the issue
   */
  test("Clear error for missing provider", () => {
    const container = new DIContainer();

    const ServiceA = defineInjectable({
      name: "ServiceA",
      factory: () => ({ value: "A" })
    });

    const ServiceB = defineInjectable({
      name: "ServiceB",
      factory: (a) => ({ value: "B", dep: a }),
      deps: [ServiceA]
    });

    // Register ServiceB but NOT ServiceA
    container.register(ServiceB.provider);

    expect(() => {
      container.get(ServiceB);
    }).toThrow(/No provider found for "ServiceA"/);
  });

  /**
   * Test: Module with nested imports
   *
   * Verifies that:
   * - Modules can import multiple other modules
   * - Services from nested imports are accessible
   * - Export chains work correctly
   */
  test("Module with nested imports and exports", () => {
    const CoreService = defineInjectable(() => ({ core: true }));

    const UtilService = defineInjectable(() => ({ util: true }));

    // Core module exports CoreService
    const coreModule = defineModule({
      providers: [CoreService.provider],
      exports: [CoreService]
    });

    // Utils module exports UtilService
    const utilsModule = defineModule({
      providers: [UtilService.provider],
      exports: [UtilService]
    });

    const AppService = defineInjectable(
      (core, util) => ({
        hasCore: core.core,
        hasUtil: util.util
      }),
      [CoreService, UtilService] as const
    );

    // App module imports both core and utils
    const appModule = defineModule({
      imports: [coreModule, utilsModule],
      providers: [AppService.provider]
    });

    const appService = appModule.container.get(AppService);
    expect(appService.hasCore).toBe(true);
    expect(appService.hasUtil).toBe(true);
  });

  /**
   * Test: Controller with async route handlers
   *
   * Verifies that:
   * - Async/await works in route handlers
   * - Services can have async methods
   * - Error handling works with async code
   */
  test("Controller with async service methods", async () => {
    const AsyncService = defineInjectable(() => ({
      fetchData: async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1));
        return { data: "async result" };
      }
    }));

    const asyncController = defineController("/async", (r, deps) => {
      r.get("/", async (c) => {
        const service = deps.get(AsyncService);
        const result = await service.fetchData();
        return c.json(result);
      });
    });

    const module = defineModule({
      controllers: [asyncController],
      providers: [AsyncService.provider]
    });

    const app = createApp(module);
    const res = await app.request("/async");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBe("async result");
  });

  /**
   * Test: Module container isolation
   *
   * Verifies that:
   * - Each module has its own container
   * - Providers registered in one module don't affect others
   * - Imported modules share their exported services
   */
  test("Module containers are isolated", () => {
    const SharedService = defineInjectable({
      name: "SharedService",
      factory: () => ({ shared: true })
    });

    const PrivateService = defineInjectable({
      name: "PrivateService",
      factory: () => ({ private: true })
    });

    // Module A has both shared and private
    const moduleA = defineModule({
      providers: [SharedService.provider, PrivateService.provider],
      exports: [SharedService] // Only export SharedService
    });

    // Module B imports A
    const moduleB = defineModule({
      imports: [moduleA]
    });

    // Module B can access SharedService
    expect(moduleB.container.has(SharedService)).toBe(true);
    const shared = moduleB.container.get(SharedService);
    expect(shared.shared).toBe(true);

    // Module B CANNOT access PrivateService (not exported)
    expect(moduleB.container.has(PrivateService)).toBe(false);
  });

  /**
   * Test: Injectable with value provider
   *
   * Verifies that:
   * - Value providers work correctly
   * - Values are returned as-is (no factory call)
   * - Useful for configuration and constants
   */
  test("Value providers for configuration", () => {
    const container = new DIContainer();

    const CONFIG_TOKEN = Symbol("Config");
    const config = {
      apiUrl: "https://api.example.com",
      timeout: 5000,
      retries: 3
    };

    container.register({
      provide: CONFIG_TOKEN,
      useValue: config
    });

    const retrieved = container.get(CONFIG_TOKEN);

    expect(retrieved).toBe(config); // Same object reference
    expect(retrieved.apiUrl).toBe("https://api.example.com");
    expect(retrieved.timeout).toBe(5000);
    expect(retrieved.retries).toBe(3);
  });

  /**
   * Test: Complex multi-module application
   *
   * Verifies complete integration:
   * - Multiple modules working together
   * - Shared services across modules
   * - Multiple controllers
   * - Full HTTP request flow
   */
  test("Complete multi-module application", async () => {
    // Database module (core infrastructure)
    const DatabaseService = defineInjectable(() => ({
      query: (sql: string) => {
        if (sql.includes("users")) {
          return [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
        }
        if (sql.includes("posts")) {
          return [{ id: 1, userId: 1, title: "Post 1" }];
        }
        return [];
      }
    }));

    const databaseModule = defineModule({
      providers: [DatabaseService.provider],
      exports: [DatabaseService]
    });

    // Users module (feature)
    const UsersService = defineInjectable(
      (db) => ({
        findAll: () => db.query("SELECT * FROM users")
      }),
      [DatabaseService] as const
    );

    const usersController = defineController("/users", (r, deps) => {
      r.get("/", (c) => {
        const users = deps.get(UsersService);
        return c.json({ users: users.findAll() });
      });
    });

    const usersModule = defineModule({
      imports: [databaseModule],
      providers: [UsersService.provider],
      controllers: [usersController],
      exports: [UsersService]
    });

    // Posts module (feature)
    const PostsService = defineInjectable(
      (db, users) => ({
        findAll: () => {
          const posts = db.query("SELECT * FROM posts") as Array<{ id: number; userId: number; title: string }>;
          return posts.map(post => ({
            ...post,
            author: users.findAll().find((u: any) => u.id === post.userId)
          }));
        }
      }),
      [DatabaseService, UsersService] as const
    );

    const postsController = defineController("/posts", (r, deps) => {
      r.get("/", (c) => {
        const posts = deps.get(PostsService);
        return c.json({ posts: posts.findAll() });
      });
    });

    const postsModule = defineModule({
      imports: [databaseModule, usersModule],
      providers: [PostsService.provider],
      controllers: [postsController]
    });

    // Root app module
    const appModule = defineModule({
      imports: [usersModule, postsModule]
    });

    const app = createApp(appModule);

    // Test users endpoint
    const usersRes = await app.request("/users");
    const usersJson = await usersRes.json();
    expect(usersRes.status).toBe(200);
    expect(usersJson.users).toHaveLength(2);

    // Test posts endpoint
    const postsRes = await app.request("/posts");
    const postsJson = await postsRes.json();
    expect(postsRes.status).toBe(200);
    expect(postsJson.posts).toHaveLength(1);
    expect(postsJson.posts[0].author.name).toBe("Alice");
  });
});

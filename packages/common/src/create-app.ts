import { Hono, type Env, type MiddlewareHandler } from "hono";
import type { HonoOptions } from "hono/hono-base";
import type { ModuleDefinition } from "./define-module";

/**
 * KahelJS app type - Hono app with only safe post-creation methods
 *
 * @remarks
 * The following methods are omitted to prevent confusion:
 * - `use()` - Global middleware must be passed to `createApp({ middleware: [...] })`
 * - `route()` - Controllers are mounted during `createApp()`, can't add more after
 * - `mount()` - Same as route(), mounting is done during creation
 * - `basePath()` - Base path shouldn't be changed after app creation
 *
 * Use these patterns instead:
 * - Global middleware: Pass to `createApp({ middleware: [...] })`
 * - Controller middleware: Use `r.use()` inside controller setup
 * - Route middleware: Pass directly to route handlers
 * - Additional routes: Add them in a controller before calling `createApp()`
 *
 * @public
 */
export type KahelApp<E extends Env = Env> = Omit<Hono<E>, 'use' | 'route' | 'mount' | 'basePath'>;

/**
 * Configuration options for creating an application
 * @public
 */
export interface CreateAppOptions<E extends Env = Env> {
  /**
   * Hono configuration options
   */
  hono?: HonoOptions<E>;

  /**
   * Global middleware to apply before mounting controllers
   *
   * @remarks
   * Middleware specified here will be applied to ALL routes in the application.
   * This is the correct way to add global middleware that should run for every request.
   *
   * @example
   * ```typescript
   * const app = createApp(appModule, {
   *   middleware: [
   *     loggerMiddleware,
   *     corsMiddleware,
   *     async (c, next) => {
   *       c.header("X-Powered-By", "KahelJS");
   *       await next();
   *     }
   *   ]
   * });
   * ```
   */
  middleware?: MiddlewareHandler<E>[];
}

/**
 * Creates a Hono application from a module definition
 *
 * @param rootModule - The root module of your application
 * @param options - Optional configuration including Hono options and global middleware
 * @returns A compiled Hono app ready to serve requests
 *
 * @remarks
 * This is the final step in building your application. It:
 * 1. Creates a new Hono app instance
 * 2. Recursively collects all controllers from the module tree
 * 3. Mounts all controllers to their respective route prefixes
 * 4. Returns a pure Hono app with zero DI overhead
 *
 * **Zero runtime overhead**:
 * - All dependency resolution happens at app creation time
 * - Controllers are instantiated once at startup
 * - Routing is compiled into Hono's efficient router
 * - Request handling has no DI-related performance cost
 *
 * **Module tree flattening**:
 * - Controllers from all modules (root + imports) are collected
 * - Duplicate controllers are automatically deduplicated
 * - Module hierarchy is flattened into a single app
 * - Route prefixes are preserved from controller definitions
 *
 * **Best practices**:
 * - Call createApp once at application startup
 * - Pass the result to your server (Bun.serve, etc.)
 * - Don't recreate the app on each request
 * - Use module imports to organize your application
 *
 * **Performance characteristics**:
 * - O(n) startup time where n = number of modules
 * - O(1) request handling (pure Hono performance)
 * - Memory efficient - controllers are shared singletons
 * - No reflection or dynamic resolution at runtime
 *
 * **Security considerations**:
 * - All services are singletons - avoid request-specific state
 * - Validate module configuration before calling createApp
 * - Use middleware for request-scoped security (auth, CORS, etc.)
 * - Error handling should be added as Hono middleware
 *
 * @example
 * Basic usage:
 * ```typescript
 * const app = createApp(appModule);
 *
 * Bun.serve({
 *   port: 3000,
 *   fetch: app.fetch
 * });
 * ```
 *
 * @example
 * With Hono options:
 * ```typescript
 * const app = createApp(appModule, {
 *   hono: { strict: true }  // Strict routing mode
 * });
 * ```
 *
 * @example
 * With global middleware:
 * ```typescript
 * const app = createApp(appModule, {
 *   middleware: [
 *     loggerMiddleware,
 *     async (c, next) => {
 *       c.header("X-Response-Time-Start", Date.now().toString());
 *       await next();
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * Complete application setup:
 * ```typescript
 * // Define modules
 * const usersModule = defineModule({
 *   controllers: [usersController],
 *   providers: [UsersService.provider]
 * });
 *
 * const postsModule = defineModule({
 *   controllers: [postsController],
 *   providers: [PostsService.provider],
 *   imports: [usersModule]  // Posts module depends on users
 * });
 *
 * // Create root module
 * const appModule = defineModule({
 *   imports: [usersModule, postsModule]
 * });
 *
 * // Create app
 * const app = createApp(appModule);
 *
 * // Start server
 * console.log("Server starting on http://localhost:3000");
 * Bun.serve({
 *   port: 3000,
 *   fetch: app.fetch
 * });
 * ```
 *
 * @example
 * With middleware:
 * ```typescript
 * const app = createApp(appModule);
 *
 * // Add global middleware
 * app.use("*", async (c, next) => {
 *   const start = Date.now();
 *   await next();
 *   const ms = Date.now() - start;
 *   c.header("X-Response-Time", `${ms}ms`);
 * });
 *
 * // Add error handling
 * app.onError((err, c) => {
 *   console.error(`Error: ${err.message}`);
 *   return c.json({ error: "Internal server error" }, 500);
 * });
 * ```
 *
 * @public
 */
export function createApp<E extends Env = Env>(
  rootModule: ModuleDefinition,
  options?: CreateAppOptions<E> | HonoOptions<E>
): KahelApp<E> {
  // Support both old API (HonoOptions) and new API (CreateAppOptions)
  const isCreateAppOptions = options && ('middleware' in options || 'hono' in options);
  const honoOptions = isCreateAppOptions ? (options as CreateAppOptions<E>).hono : options as HonoOptions<E> | undefined;
  const middleware = isCreateAppOptions ? (options as CreateAppOptions<E>).middleware : undefined;

  // Create a single Hono app instance
  const app = new Hono<E>(honoOptions);

  // Apply global middleware BEFORE mounting controllers
  // This ensures middleware runs for all routes
  if (middleware && middleware.length > 0) {
    middleware.forEach(mw => {
      app.use("*", mw);
    });
  }

  // Set to collect unique controllers from the module tree
  // Using Set automatically handles deduplication
  const allControllers = new Set<{ prefix: string; app: Hono }>();

  /**
   * Recursively collects controllers from a module and its imports
   *
   * @param module - The module to collect controllers from
   *
   * @remarks
   * This function:
   * - Adds the module's own controllers to the set
   * - Recursively processes all imported modules
   * - Uses Set for automatic deduplication
   * - Preserves controller prefixes from definitions
   *
   * @internal
   */
  function collectControllers(module: ModuleDefinition) {
    // Add this module's controllers
    module.controllers.forEach((controller) => {
      allControllers.add(controller);
    });

    // Recursively collect from imported modules
    // This flattens the entire module tree
    module.imports.forEach((importedModule) => {
      collectControllers(importedModule);
    });
  }

  // Collect all controllers at startup (compile-time resolution)
  // This happens once when the app is created, not on each request
  collectControllers(rootModule);

  // Mount all controllers to the app
  // Each controller is mounted to its prefix (e.g., "/users", "/posts")
  // This compiles all routes into Hono's efficient router
  allControllers.forEach((controller) => {
    app.route(controller.prefix, controller.app);
  });

  // Return the compiled Hono app without the use() method
  // At this point, it's a pure Hono app with no DI overhead
  // All dependency resolution and controller setup is complete
  // The use() method is omitted to prevent confusion about middleware ordering
  return app as KahelApp<E>;
}

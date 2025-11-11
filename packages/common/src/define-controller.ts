import { Hono, type Handler } from "hono";
import { DIContainer } from "./di-container";

/**
 * Handler function type for route handlers
 * @public
 */
type RouteHandler = Handler;

/**
 * Route builder interface for defining HTTP routes
 *
 * @remarks
 * Provides a clean API for defining routes with HTTP methods.
 * All handlers receive the Hono context and can access DI container services.
 *
 * @public
 */
interface RouteBuilder {
  /**
   * Registers middleware for the controller
   * @param path - The path pattern to match (e.g., "*", "/users/*")
   * @param handlers - One or more middleware handlers
   *
   * @remarks
   * Middleware registered with `use()` will apply to all routes defined AFTER it.
   * For controller-level middleware, call `use()` at the beginning of the setup function.
   *
   * @example
   * Apply middleware to all routes in controller:
   * ```typescript
   * defineController("/api", (r, deps) => {
   *   // Apply auth middleware to all routes
   *   r.use("*", authMiddleware);
   *
   *   // These routes will have auth middleware applied
   *   r.get("/profile", (c) => c.json({ user: c.get("user") }));
   *   r.get("/data", (c) => c.json({ data: [] }));
   * });
   * ```
   *
   * @example
   * Apply middleware to specific paths:
   * ```typescript
   * defineController("/api", (r, deps) => {
   *   // Public routes (no middleware)
   *   r.get("/health", (c) => c.json({ status: "ok" }));
   *
   *   // Apply auth middleware only to admin routes
   *   r.use("/admin/*", authMiddleware, adminOnlyMiddleware);
   *
   *   // These routes will have both middlewares applied
   *   r.get("/admin/users", (c) => c.json({ users: [] }));
   *   r.get("/admin/settings", (c) => c.json({ settings: {} }));
   * });
   * ```
   */
  use(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers a GET route
   * @param path - The route path (e.g., "/", "/:id", "/search")
   * @param handlers - One or more route handlers
   *
   * @example
   * ```typescript
   * r.get("/users", (c) => c.json({ users: [] }));
   * r.get("/users/:id", (c) => c.json({ id: c.req.param("id") }));
   * ```
   */
  get(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers a POST route
   * @param path - The route path
   * @param handlers - One or more route handlers
   *
   * @example
   * ```typescript
   * r.post("/users", async (c) => {
   *   const body = await c.req.json();
   *   return c.json({ created: true }, 201);
   * });
   * ```
   */
  post(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers a PUT route
   * @param path - The route path
   * @param handlers - One or more route handlers
   */
  put(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers a DELETE route
   * @param path - The route path
   * @param handlers - One or more route handlers
   */
  delete(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers a PATCH route
   * @param path - The route path
   * @param handlers - One or more route handlers
   */
  patch(path: string, ...handlers: RouteHandler[]): void;

  /**
   * Registers an OPTIONS route
   * @param path - The route path
   * @param handlers - One or more route handlers
   *
   * @remarks
   * Commonly used for CORS preflight requests
   *
   * @example
   * ```typescript
   * r.options("/users", (c) => {
   *   return c.json({ methods: ["GET", "POST", "PUT", "DELETE"] });
   * });
   * ```
   */
  options(path: string, ...handlers: RouteHandler[]): void;
}

/**
 * Creates a route registration function for a specific HTTP method
 *
 * @param app - The Hono application instance
 * @param method - The HTTP method (get, post, put, delete, patch, options)
 * @returns A function that registers routes for the given method
 *
 * @internal
 */
function createRoute(app: Hono, method: "get" | "post" | "put" | "delete" | "patch" | "options") {
  return (path: string, ...handlers: RouteHandler[]) => {
    app[method](path, ...handlers);
  };
}

/**
 * Internal controller definition with full Hono access (for framework use)
 * @internal
 */
export type InternalControllerDefinition = {
  prefix: string;
  app: Hono;
};

/**
 * Controller app type without methods that shouldn't be called externally
 * @public
 */
export type ControllerApp = Omit<Hono, 'use'>;

/**
 * Controller definition containing the route prefix and Hono app instance
 * @public
 */
type ControllerDefinition = {
  /** The URL prefix for all routes in this controller */
  prefix: string;
  /**
   * The Hono application instance with registered routes.
   * Note: `use()` method is not available - use `r.use()` inside the controller setup instead.
   */
  app: ControllerApp;
};

/**
 * Controller factory type - can be called with a DI container
 * or used directly with its prefix and app properties
 *
 * @public
 */
type ControllerFactory = ((container: DIContainer) => InternalControllerDefinition) & ControllerDefinition;

/**
 * Defines a controller with routes and dependency injection support
 *
 * @param prefix - The URL prefix for all routes (e.g., "/users", "/api/posts")
 * @param setup - Setup function that receives a route builder and DI container
 * @returns A controller factory that can be used in modules
 *
 * @remarks
 * This function creates a controller that:
 * - Automatically handles dependency injection
 * - Provides a clean API for defining routes
 * - Can be used both as a factory function and as a direct controller
 *
 * The setup function receives:
 * - `r`: Route builder with methods for HTTP verbs (get, post, put, delete, patch)
 * - `deps`: DI container for resolving services
 *
 * Security considerations:
 * - Always validate user input in route handlers
 * - Use proper authentication/authorization middleware
 * - Sanitize params and query strings before use
 *
 * @example
 * Basic controller:
 * ```typescript
 * export const usersController = defineController("/users", (r, deps) => {
 *   // GET /users
 *   r.get("/", (c) => {
 *     const service = deps.get(UsersService);
 *     return c.json({ users: service.findAll() });
 *   });
 *
 *   // POST /users
 *   r.post("/", async (c) => {
 *     const service = deps.get(UsersService);
 *     const body = await c.req.json();
 *     const user = service.create(body);
 *     return c.json({ user }, 201);
 *   });
 * });
 * ```
 *
 * @example
 * Controller with middleware and validation:
 * ```typescript
 * export const authController = defineController("/auth", (r, deps) => {
 *   const authService = deps.get(AuthService); // Resolve once for all routes
 *
 *   r.post("/login", async (c) => {
 *     const { email, password } = await c.req.json();
 *
 *     // Validate input
 *     if (!email || !password) {
 *       return c.json({ error: "Missing credentials" }, 400);
 *     }
 *
 *     const user = await authService.login(email, password);
 *     return c.json({ user });
 *   });
 * });
 * ```
 *
 * @example
 * Use in module:
 * ```typescript
 * const module = defineModule({
 *   controllers: [usersController],
 *   providers: [UsersService.provider]
 * });
 * ```
 *
 * @public
 */
export function defineController(
  prefix: string,
  setup: (r: RouteBuilder, deps: DIContainer) => void
): ControllerFactory {
  // Factory function: creates controller with given DI container
  const factory = (container: DIContainer): InternalControllerDefinition => {
    const app = new Hono();

    // Create route builder with all HTTP methods
    const routeBuilder: RouteBuilder = {
      use: (path: string, ...handlers: RouteHandler[]) => {
        app.use(path, ...handlers);
      },
      get: createRoute(app, "get"),
      post: createRoute(app, "post"),
      put: createRoute(app, "put"),
      delete: createRoute(app, "delete"),
      patch: createRoute(app, "patch"),
      options: createRoute(app, "options"),
    };

    // Call setup function to register routes
    setup(routeBuilder, container);

    return {
      prefix,
      app,
    };
  };

  // Create default instance for direct use (lazy evaluation for performance)
  // This allows the controller to be used without explicit module system
  const defaultContainer = new DIContainer();
  const defaultDefinition = factory(defaultContainer);

  // Merge factory function with default definition properties
  const controller = factory as ControllerFactory;
  controller.prefix = defaultDefinition.prefix;
  // Cast to ControllerApp to hide use() method from external API
  controller.app = defaultDefinition.app as ControllerApp;

  return controller;
}

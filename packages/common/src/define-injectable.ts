import type { Constructor, Token } from "./di-container";

/**
 * A functional injectable that can be used as a DI token
 *
 * @remarks
 * An Injectable is a self-describing service definition that includes:
 * - A unique symbol token for DI resolution
 * - Dependency declarations
 * - A factory function to create instances
 * - A provider configuration for module registration
 *
 * Injectables can be used:
 * - As tokens in deps.get(injectable)
 * - As dependencies in other injectables
 * - In module provider arrays via injectable.provider
 *
 * @example
 * ```typescript
 * const userService = defineInjectable(() => ({
 *   findAll: () => users
 * }));
 *
 * // Use as token
 * const service = deps.get(userService);
 *
 * // Use as dependency
 * const postService = defineInjectable(
 *   (userService) => ({ ... }),
 *   [userService]
 * );
 * ```
 *
 * @public
 */
export interface Injectable<T = any> {
  /**
   * Unique symbol token for DI resolution
   *
   * @remarks
   * Symbol tokens prevent naming collisions and provide strong identity
   */
  readonly token: symbol;

  /**
   * Human-readable name for debugging and error messages
   */
  readonly name: string;

  /**
   * Dependencies required by this injectable
   *
   * @remarks
   * Can contain Token objects or other Injectable objects.
   * Injectable dependencies are automatically converted to their tokens.
   */
  readonly deps: readonly (Token | Injectable)[];

  /**
   * Factory function that creates the service instance
   *
   * @remarks
   * Receives resolved dependencies as parameters in the order declared
   */
  readonly factory: (...args: any[]) => T;

  /**
   * Lifecycle of the injectable instance
   *
   * @remarks
   * - singleton: Created once and cached (default)
   * - transient: Created fresh on each request
   */
  readonly lifetime: "singleton" | "transient";

  /**
   * Provider configuration for module registration
   *
   * @remarks
   * This provider can be directly added to a module's providers array.
   * Injectable tokens in deps are automatically converted to symbol tokens.
   *
   * @example
   * ```typescript
   * defineModule({
   *   providers: [userService.provider]
   * })
   * ```
   */
  readonly provider: {
    provide: symbol;
    useFactory: (...args: any[]) => T;
    deps: readonly Token[];
    lifetime: "singleton" | "transient";
  };
}

/**
 * A token that can be either a standard Token or an Injectable
 *
 * @remarks
 * Used in dependency arrays to support both traditional tokens and Injectables
 *
 * @public
 */
export type InjectableToken<T = any> = Token<T> | Injectable<T>;

/**
 * Extracts the return type from a factory function
 *
 * @remarks
 * Used internally for type inference. Ensures the Injectable's generic type
 * matches the factory function's return type.
 *
 * @internal
 */
type InferFactory<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Extracts dependency types from a tuple of InjectableTokens
 *
 * @remarks
 * This type performs complex type inference to convert a tuple of tokens
 * into the corresponding tuple of their value types.
 *
 * - Injectable<U> → U (the service type)
 * - Constructor<U> → U (the class instance type)
 * - Token<U> → U (the token's type parameter)
 * - Otherwise → any
 *
 * This enables automatic parameter typing in factory functions.
 *
 * @example
 * ```typescript
 * // Given: [Injectable<UserService>, Injectable<DbService>]
 * // Result: [UserService, DbService]
 * ```
 *
 * @internal
 */
type InferDeps<T extends readonly InjectableToken[]> = {
  [K in keyof T]: T[K] extends Injectable<infer U>
    ? U
    : T[K] extends Constructor<infer U>
    ? U
    : T[K] extends Token<infer U>
    ? U
    : any;
};

/**
 * Infers a dependency tuple from factory function parameters
 *
 * @remarks
 * Currently unused but preserved for potential future enhancements
 * where parameter types could drive dependency resolution.
 *
 * @internal
 */
type InferDepsFromFactory<T> = T extends (...args: infer P) => any
  ? readonly [...{ [K in keyof P]: InjectableToken }]
  : readonly [];

/**
 * Configuration object for defining a functional injectable
 *
 * @remarks
 * This is the advanced usage pattern for defineInjectable.
 * For most use cases, prefer the simpler function-based syntax:
 * - `defineInjectable(() => service)` for no dependencies
 * - `defineInjectable((dep1, dep2) => service, [dep1, dep2])` with dependencies
 *
 * Use the config object when you need:
 * - Explicit naming (instead of function.name)
 * - Transient lifetime
 * - Better documentation/organization for complex services
 *
 * @example
 * ```typescript
 * const logger = defineInjectable({
 *   name: "Logger",
 *   factory: (config) => new ConsoleLogger(config),
 *   deps: [ConfigService],
 *   lifetime: "singleton"
 * });
 * ```
 *
 * @public
 */
export interface InjectableConfig<
  TDeps extends readonly InjectableToken[] = readonly [],
  TFactory extends (...args: InferDeps<TDeps>) => any = (
    ...args: InferDeps<TDeps>
  ) => any
> {
  /**
   * Unique name for this injectable
   *
   * @remarks
   * Used for the Symbol description and in error messages
   */
  name: string;

  /**
   * Dependencies to inject into the factory function
   *
   * @remarks
   * Can be:
   * - String tokens: "ServiceName"
   * - Symbol tokens: Symbol("ServiceName")
   * - Constructor tokens: MyClass
   * - Injectable objects: otherService
   *
   * Dependencies are resolved in order and passed as factory parameters
   */
  deps?: TDeps;

  /**
   * Factory function that creates the service instance
   *
   * @remarks
   * Receives resolved dependencies as parameters.
   * The return value becomes the service instance.
   */
  factory: TFactory;

  /**
   * Lifecycle of the injectable instance
   *
   * @remarks
   * - singleton: Created once and cached for entire application lifetime (default)
   * - transient: Created fresh on every deps.get() call
   *
   * Use transient for:
   * - Request-scoped services in web applications
   * - Services that hold mutable state per operation
   * - Services with side effects that shouldn't be shared
   */
  lifetime?: "singleton" | "transient";
}

/**
 * Defines a functional injectable service with type-safe dependency injection
 *
 * @remarks
 * This is the core function for creating services in the DI system.
 * It provides three syntax options:
 *
 * 1. **Simple factory (no dependencies)**:
 *    `defineInjectable(() => service)`
 *
 * 2. **Factory with dependencies (recommended)**:
 *    `defineInjectable((dep1, dep2) => service, [dep1, dep2])`
 *
 * 3. **Config object (advanced)**:
 *    `defineInjectable({ name, factory, deps, lifetime })`
 *
 * **Key Features**:
 * - **Automatic type inference**: No manual type annotations needed
 * - **Symbol-based tokens**: Prevents naming collisions
 * - **Compile-time safety**: TypeScript ensures correct dependency usage
 * - **Singleton by default**: Instances are cached automatically
 * - **Composable**: Injectables can depend on other Injectables
 *
 * **Best Practices**:
 * - Export injectables as named constants
 * - Use function names for automatic naming
 * - Keep factories pure (no side effects during creation)
 * - Organize services by feature/domain
 * - Use `as const` on dependency arrays for strict typing
 *
 * **Security Considerations**:
 * - Services are singletons by default - avoid storing request-specific data
 * - Use transient lifetime for request-scoped services
 * - Validate all inputs in service methods
 * - Avoid circular dependencies (detected at runtime)
 *
 * @param factory - Factory function that creates the service (overload 1 & 2)
 * @param deps - Array of dependencies (overload 2)
 * @param config - Configuration object (overload 3)
 * @returns An Injectable object that can be used as a token and in provider arrays
 *
 * @example
 * Basic service (no dependencies):
 * ```typescript
 * export const ConfigService = defineInjectable(() => ({
 *   apiUrl: "https://api.example.com",
 *   timeout: 5000
 * }));
 * ```
 *
 * @example
 * Service with dependencies:
 * ```typescript
 * export const UsersService = defineInjectable(
 *   (db) => ({
 *     findAll: async () => await db.query("SELECT * FROM users"),
 *     findById: async (id: number) => await db.query("SELECT * FROM users WHERE id = ?", [id])
 *   }),
 *   [DatabaseService] as const
 * );
 * ```
 *
 * @example
 * Multiple dependencies with auto-typing:
 * ```typescript
 * export const PostsService = defineInjectable(
 *   (users, db, cache) => ({
 *     async findAllWithAuthors() {
 *       const posts = await db.query("SELECT * FROM posts");
 *       return Promise.all(
 *         posts.map(async (post) => ({
 *           ...post,
 *           author: await users.findById(post.authorId)
 *         }))
 *       );
 *     }
 *   }),
 *   [UsersService, DatabaseService, CacheService] as const
 * );
 * ```
 *
 * @example
 * Transient service (new instance per request):
 * ```typescript
 * export const RequestLogger = defineInjectable({
 *   name: "RequestLogger",
 *   factory: () => ({
 *     logs: [],
 *     log(message: string) { this.logs.push(message); },
 *     getLogs() { return this.logs; }
 *   }),
 *   lifetime: "transient"  // New instance each time
 * });
 * ```
 *
 * @example
 * Using in modules and controllers:
 * ```typescript
 * // In module
 * export const usersModule = defineModule({
 *   providers: [
 *     DatabaseService.provider,
 *     UsersService.provider
 *   ]
 * });
 *
 * // In controller
 * export const usersController = defineController("/users", (r, deps) => {
 *   const usersService = deps.get(UsersService);
 *
 *   r.get("/", async (c) => {
 *     const users = await usersService.findAll();
 *     return c.json({ users });
 *   });
 * });
 * ```
 *
 * @public
 */

// Overload 1: Simple factory function (no dependencies)
export function defineInjectable<TFactory extends () => any>(
  factory: TFactory
): Injectable<InferFactory<TFactory>>;

// Overload 2: Factory with dependencies (factory first, deps second)
export function defineInjectable<
  const TDeps extends readonly InjectableToken[],
  TFactory extends (...args: InferDeps<TDeps>) => any
>(
  factory: TFactory,
  deps: TDeps
): Injectable<InferFactory<TFactory>>;

// Overload 3: Full config object (for advanced use cases)
export function defineInjectable<
  TDeps extends readonly InjectableToken[],
  TFactory extends (...args: InferDeps<TDeps>) => any
>(
  config: InjectableConfig<TDeps, TFactory>
): Injectable<InferFactory<TFactory>>;

/**
 * Implementation of defineInjectable
 *
 * @remarks
 * This implementation handles three different call signatures:
 * 1. Function only: defineInjectable(factory)
 * 2. Function with deps: defineInjectable(factory, [deps])
 * 3. Config object: defineInjectable({ name, factory, deps })
 *
 * The function:
 * - Parses the arguments to determine which overload was used
 * - Extracts name, factory, deps, and lifetime
 * - Creates a unique Symbol token
 * - Converts Injectable dependencies to their tokens
 * - Returns an Injectable object with all metadata
 *
 * @internal
 */
export function defineInjectable<
  TDeps extends readonly InjectableToken[],
  TFactory extends (...args: any[]) => any
>(
  factoryOrDepsOrConfig: TFactory | TDeps | InjectableConfig<TDeps, TFactory>,
  maybeFactoryOrDeps?: TFactory | TDeps
): Injectable<InferFactory<TFactory>> {
  let name: string;
  let deps: readonly InjectableToken[];
  let factory: TFactory;
  let lifetime: "singleton" | "transient" = "singleton";

  // Parse arguments based on overload pattern
  if (typeof factoryOrDepsOrConfig === "function") {
    factory = factoryOrDepsOrConfig as TFactory;

    if (Array.isArray(maybeFactoryOrDeps)) {
      // Overload 2: (factory, [deps]) - recommended pattern
      deps = maybeFactoryOrDeps;
    } else {
      // Overload 1: (factory) - simple factory with no dependencies
      deps = [];
    }
    // Use function name for automatic naming
    name = factory.name || "AnonymousInjectable";
  } else if (Array.isArray(factoryOrDepsOrConfig)) {
    // Backwards compatibility: ([deps], factory)
    if (!maybeFactoryOrDeps || typeof maybeFactoryOrDeps !== "function") {
      throw new Error("Factory function is required when providing dependencies");
    }
    deps = factoryOrDepsOrConfig;
    factory = maybeFactoryOrDeps as TFactory;
    name = factory.name || "AnonymousInjectable";
  } else {
    // Overload 3: Config object for advanced usage
    const config = factoryOrDepsOrConfig as InjectableConfig<TDeps, TFactory>;
    name = config.name;
    deps = (config.deps || []) as readonly InjectableToken[];
    factory = config.factory as TFactory;
    lifetime = config.lifetime || "singleton";
  }

  // Create unique symbol token (prevents collisions)
  const token = Symbol(name);

  // Convert Injectable objects to their underlying symbol tokens
  // This allows Injectables to be used as dependencies
  const extractedDeps = deps.map((dep) =>
    isInjectable(dep) ? dep.token : dep
  ) as readonly Token[];

  // Build the Injectable object with all metadata
  const injectable: Injectable<InferFactory<TFactory>> = {
    token,
    name,
    deps,
    factory: factory as any,
    lifetime,
    provider: {
      provide: token,
      useFactory: factory as any,
      deps: extractedDeps as any,
      lifetime,
    },
  };

  return injectable;
}

/**
 * Type guard to check if a value is an Injectable object
 *
 * @param value - The value to check
 * @returns true if value is an Injectable, false otherwise
 *
 * @remarks
 * Checks for the presence of token and provider properties
 * and verifies the token is a symbol.
 *
 * Used internally to distinguish Injectable objects from regular tokens
 * in dependency arrays.
 *
 * @internal
 */
function isInjectable(value: any): value is Injectable {
  return (
    value &&
    typeof value === "object" &&
    "token" in value &&
    "provider" in value &&
    typeof value.token === "symbol"
  );
}

/**
 * Helper type to extract the service type from an Injectable
 *
 * @remarks
 * Useful for type annotations when you need to reference the service type
 * without importing the actual service.
 *
 * @example
 * ```typescript
 * const userService = defineInjectable(() => ({
 *   findAll: () => users
 * }));
 *
 * // Extract the type
 * type UserService = InferInjectable<typeof userService>;
 * // Equivalent to: { findAll: () => User[] }
 * ```
 *
 * @public
 */
export type InferInjectable<T> = T extends Injectable<infer U> ? U : never;

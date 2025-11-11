/**
 * Constructor type for class-based providers
 * @public
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Token used to identify a provider in the DI container
 *
 * @remarks
 * Tokens can be:
 * - string: Simple string identifiers (e.g., "UserService")
 * - symbol: Unique symbols for collision-free tokens
 * - Constructor: Class constructors that serve as their own tokens
 *
 * @example
 * ```typescript
 * const TOKEN_STRING = "UserService";
 * const TOKEN_SYMBOL = Symbol("UserService");
 * class UserService {} // Class itself is the token
 * ```
 *
 * @public
 */
export type Token<T = any> = string | symbol | Constructor<T>;

/**
 * Lifetime of a provider instance
 *
 * @remarks
 * - singleton: Created once and reused for all requests (default)
 * - transient: Created fresh for each request
 *
 * @public
 */
export type Lifetime = "singleton" | "transient";

/**
 * Injectable interface (minimal definition to avoid circular dependency)
 *
 * @remarks
 * This is a minimal interface to support Injectable tokens without circular imports.
 * The full Injectable interface is defined in defineInjectable.ts
 *
 * @internal
 */
export interface InjectableLike<T = any> {
  readonly token: symbol;
  readonly provider: {
    provide: symbol;
    useFactory: (...args: any[]) => T;
    deps: readonly Token[];
    lifetime: "singleton" | "transient";
  };
}

/**
 * Base provider interface with common properties
 * @internal
 */
interface BaseProvider<T = any> {
  /** Token that identifies this provider */
  provide: Token<T>;
  /** Lifetime of the provider instance (default: singleton) */
  lifetime?: Lifetime;
}

/**
 * Provider that supplies a pre-existing value
 *
 * @remarks
 * Use for configuration objects, constants, or already-instantiated instances
 *
 * @example
 * ```typescript
 * const configProvider: ValueProvider = {
 *   provide: "CONFIG",
 *   useValue: { apiUrl: "https://api.example.com" }
 * };
 * ```
 *
 * @public
 */
export interface ValueProvider<T = any> extends BaseProvider<T> {
  /** The value to provide */
  useValue: T;
}

/**
 * Provider that creates instances from a class constructor
 *
 * @remarks
 * Dependencies are resolved automatically from the deps array or class.inject property
 *
 * @example
 * ```typescript
 * const userServiceProvider: ClassProvider = {
 *   provide: "UserService",
 *   useClass: UserService,
 *   deps: [DatabaseService]
 * };
 * ```
 *
 * @public
 */
export interface ClassProvider<T = any> extends BaseProvider<T> {
  /** The class to instantiate */
  useClass: Constructor<T>;
  /** Dependencies to inject into the constructor */
  deps?: readonly Token[];
}

/**
 * Provider that creates instances using a factory function
 *
 * @remarks
 * Factory functions receive resolved dependencies as parameters.
 * This is the provider type used by defineInjectable.
 *
 * @example
 * ```typescript
 * const loggerProvider: FactoryProvider = {
 *   provide: "Logger",
 *   useFactory: (config) => createLogger(config),
 *   deps: ["CONFIG"]
 * };
 * ```
 *
 * @public
 */
export interface FactoryProvider<T = any> extends BaseProvider<T> {
  /** Factory function that creates the instance */
  useFactory: (...args: any[]) => T;
  /** Dependencies to resolve and pass to the factory */
  deps?: readonly Token[];
}

/**
 * Union type of all provider types
 * @public
 */
export type Provider<T = any> = ValueProvider<T> | ClassProvider<T> | FactoryProvider<T>;

/**
 * Internal lookup result containing provider and owning container
 * @internal
 */
interface ProviderLookup {
  provider: Provider;
  owner: DIContainer;
}

/**
 * Type guard to check if a token is a constructor function
 * @internal
 */
function isConstructorToken(token: Token): token is Constructor<any> {
  return typeof token === "function" && token.prototype != null;
}

/**
 * Type guard to check if a value is an Injectable object
 *
 * @remarks
 * Checks for the presence of token and provider properties
 *
 * @internal
 */
function isInjectableLike(value: any): value is InjectableLike {
  return (
    value &&
    typeof value === "object" &&
    "token" in value &&
    "provider" in value &&
    typeof value.token === "symbol"
  );
}

/**
 * Type guard to check if a provider is a ClassProvider
 * @internal
 */
function isClassProvider(provider: Provider): provider is ClassProvider {
  return "useClass" in provider;
}

/**
 * Type guard to check if a provider is a FactoryProvider
 * @internal
 */
function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return "useFactory" in provider;
}

/**
 * Extracts injection tokens from a class's static inject property
 *
 * @param ctor - The class constructor
 * @returns Array of tokens if class.inject exists, undefined otherwise
 *
 * @internal
 */
function getInjectTokens(ctor: Constructor<any>): Token[] | undefined {
  const inject = (ctor as any).inject;
  return Array.isArray(inject) ? inject : undefined;
}

/**
 * Dependency Injection Container
 *
 * @remarks
 * A type-safe DI container that manages service registration and resolution.
 *
 * Features:
 * - **Automatic dependency resolution**: Dependencies are resolved recursively
 * - **Singleton and transient lifetimes**: Control instance creation
 * - **Hierarchical containers**: Child containers inherit parent providers
 * - **Circular dependency detection**: Helpful error messages for cycles
 * - **Missing provider detection**: Clear errors with dependency chains
 * - **Debug mode**: Warnings for duplicate registrations
 * - **Injectable support**: Works seamlessly with defineInjectable
 *
 * Security considerations:
 * - Providers are registered at startup, preventing runtime injection attacks
 * - Map-based storage prevents prototype pollution
 * - Circular dependency detection prevents infinite loops
 * - Clear error messages help identify misconfigurations early
 *
 * @example
 * Basic usage:
 * ```typescript
 * const container = new DIContainer();
 *
 * // Register providers
 * container.register({
 *   provide: "CONFIG",
 *   useValue: { apiUrl: "https://api.example.com" }
 * });
 *
 * container.register({
 *   provide: "Logger",
 *   useFactory: (config) => new Logger(config),
 *   deps: ["CONFIG"]
 * });
 *
 * // Resolve instances
 * const logger = container.get("Logger");
 * ```
 *
 * @example
 * With defineInjectable:
 * ```typescript
 * const userService = defineInjectable(
 *   (db) => ({
 *     findAll: () => db.query("SELECT * FROM users")
 *   }),
 *   [DatabaseService]
 * );
 *
 * container.register(userService.provider);
 * const service = container.get(userService);
 * ```
 *
 * @example
 * Debug mode:
 * ```typescript
 * const container = new DIContainer(undefined, { debug: true });
 * // Warns about duplicate registrations
 * ```
 *
 * @public
 */
export class DIContainer {
  /** Map of registered providers by token */
  private readonly providers = new Map<Token, Provider>();

  /** Map of singleton instances by token */
  private readonly instances = new Map<Token, any>();

  /** Debug mode flag for additional warnings */
  private readonly debug: boolean;

  /**
   * Creates a new DI container
   *
   * @param parent - Optional parent container for hierarchical DI
   * @param options - Configuration options
   * @param options.debug - Enable debug mode for duplicate registration warnings
   *
   * @example
   * ```typescript
   * // Root container
   * const root = new DIContainer();
   *
   * // Child container with debug mode
   * const child = new DIContainer(root, { debug: true });
   * ```
   */
  constructor(private readonly parent?: DIContainer, options?: { debug?: boolean }) {
    this.debug = options?.debug ?? false;
  }

  /**
   * Registers a provider in the container
   *
   * @param provider - The provider to register (Value, Class, or Factory)
   *
   * @remarks
   * - If a provider with the same token exists, it will be overwritten
   * - In debug mode, a warning is logged for duplicate registrations
   * - Value providers have their instances cached immediately
   * - Other providers are instantiated lazily on first get()
   *
   * @example
   * ```typescript
   * container.register({
   *   provide: "UserService",
   *   useClass: UserService,
   *   deps: [DatabaseService]
   * });
   * ```
   */
  register<T>(provider: Provider<T>): void {
    // Warn about duplicate registration
    if (this.providers.has(provider.provide)) {
      const tokenName = this.getTokenName(provider.provide);
      if (this.debug) {
        console.warn(
          `[DI Container] Warning: Overwriting existing provider for token "${tokenName}". ` +
          `This may indicate a misconfiguration.`
        );
      }
    }

    this.providers.set(provider.provide, provider);
    if ("useValue" in provider) {
      this.instances.set(provider.provide, provider.useValue);
    } else {
      this.instances.delete(provider.provide);
    }
  }

  /**
   * Gets a human-readable name for a token
   *
   * @param token - The token to get a name for
   * @returns A human-readable string representation
   *
   * @internal
   */
  private getTokenName(token: Token): string {
    if (typeof token === "string") return token;
    if (typeof token === "symbol") return token.description || "Symbol";
    if (typeof token === "function") return token.name || "AnonymousClass";
    return String(token);
  }

  /**
   * Registers multiple providers at once
   *
   * @param providers - Array of providers to register
   *
   * @example
   * ```typescript
   * container.registerMany([
   *   userService.provider,
   *   postService.provider,
   *   authService.provider
   * ]);
   * ```
   */
  registerMany(providers: Provider[]): void {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  /**
   * Registers a value provider (convenience method)
   *
   * @param token - The token to register
   * @param value - The value to provide
   *
   * @example
   * ```typescript
   * container.registerValue("CONFIG", { apiUrl: "https://api.example.com" });
   * ```
   */
  registerValue<T>(token: Token<T> | InjectableLike<T>, value: T): void {
    const actualToken = isInjectableLike(token) ? token.token : token;
    this.register({ provide: actualToken, useValue: value });
  }

  /**
   * Registers a class provider (convenience method)
   *
   * @param token - The token to register
   * @param useClass - The class to instantiate (optional if token is a constructor)
   * @param options - Provider options
   * @param options.deps - Dependencies to inject
   * @param options.lifetime - Instance lifetime (default: singleton)
   *
   * @throws {Error} If token is not a constructor and useClass is not provided
   *
   * @example
   * ```typescript
   * container.registerClass("UserService", UserService, {
   *   deps: [DatabaseService]
   * });
   * ```
   */
  registerClass<T>(
    token: Token<T> | InjectableLike<T>,
    useClass?: Constructor<T>,
    options?: { deps?: Token[]; lifetime?: Lifetime }
  ): void {
    const actualToken = isInjectableLike(token) ? token.token : token;
    const targetClass = useClass ?? (isConstructorToken(actualToken) ? (actualToken as Constructor<T>) : undefined);

    if (!targetClass) {
      throw new Error("registerClass requires a constructor token or useClass value");
    }

    this.register({
      provide: actualToken,
      useClass: targetClass,
      deps: options?.deps,
      lifetime: options?.lifetime,
    });
  }

  /**
   * Registers a factory provider (convenience method)
   *
   * @param token - The token to register
   * @param useFactory - The factory function
   * @param options - Provider options
   * @param options.deps - Dependencies to inject into the factory
   * @param options.lifetime - Instance lifetime (default: singleton)
   *
   * @example
   * ```typescript
   * container.registerFactory("Logger", (config) => new Logger(config), {
   *   deps: ["CONFIG"]
   * });
   * ```
   */
  registerFactory<T>(
    token: Token<T> | InjectableLike<T>,
    useFactory: (...args: any[]) => T,
    options?: { deps?: Token[]; lifetime?: Lifetime }
  ): void {
    const actualToken = isInjectableLike(token) ? token.token : token;
    this.register({
      provide: actualToken,
      useFactory,
      deps: options?.deps,
      lifetime: options?.lifetime,
    });
  }

  /**
   * Resolves and returns an instance for the given token
   *
   * @param token - The token or Injectable to resolve
   * @returns The resolved instance
   *
   * @throws {Error} If no provider is found for the token
   * @throws {Error} If a circular dependency is detected
   * @throws {Error} If instantiation fails
   *
   * @remarks
   * - For singletons, the same instance is returned on subsequent calls
   * - For transients, a new instance is created each time
   * - Dependencies are resolved recursively
   * - Supports Injectable tokens from defineInjectable
   *
   * @example
   * ```typescript
   * const userService = container.get("UserService");
   * const logger = container.get(loggerInjectable);
   * ```
   */
  get<T = any>(token: Token<T> | InjectableLike<T>): T {
    // If it's an Injectable, extract the token
    const actualToken = isInjectableLike(token) ? token.token : token;
    return this.resolve(actualToken, new Set());
  }

  /**
   * Checks if a provider is registered for the given token
   *
   * @param token - The token or Injectable to check
   * @returns true if a provider exists, false otherwise
   *
   * @remarks
   * Searches both the current container and parent containers
   *
   * @example
   * ```typescript
   * if (container.has("UserService")) {
   *   const service = container.get("UserService");
   * }
   * ```
   */
  has(token: Token | InjectableLike): boolean {
    const actualToken = isInjectableLike(token) ? token.token : token;
    return this.providers.has(actualToken) || (this.parent?.has(actualToken) ?? false);
  }

  /**
   * Creates a child container that inherits from this container
   *
   * @returns A new DIContainer with this container as parent
   *
   * @remarks
   * Child containers:
   * - Can resolve providers from parent
   * - Can override parent providers with their own
   * - Have separate instance caches for singletons
   * - Useful for request-scoped services in web apps
   *
   * @example
   * ```typescript
   * const rootContainer = new DIContainer();
   * const requestContainer = rootContainer.createChild();
   * ```
   */
  createChild(): DIContainer {
    return new DIContainer(this);
  }

  /**
   * Resolves a token to its instance
   *
   * @param token - The token to resolve
   * @param resolving - Set of currently resolving tokens for cycle detection
   * @returns The resolved instance
   *
   * @throws {Error} If provider not found
   * @throws {Error} If circular dependency detected
   * @throws {Error} If instantiation fails
   *
   * @remarks
   * This is the core resolution algorithm:
   * 1. Look up provider (current container or parent)
   * 2. Auto-register constructor tokens if not found
   * 3. Return cached singleton if available
   * 4. Check for circular dependencies
   * 5. Instantiate and cache if singleton
   *
   * @internal
   */
  private resolve<T>(token: Token<T>, resolving: Set<Token>): T {
    const lookup = this.lookupProvider(token);

    if (!lookup) {
      // Auto-register constructor tokens for convenience
      if (isConstructorToken(token)) {
        this.register({ provide: token, useClass: token as Constructor<T> });
        return this.resolve(token, resolving);
      }

      const tokenName = this.getTokenName(token);
      const resolvingNames = Array.from(resolving).map(t => this.getTokenName(t));

      throw new Error(
        `[DI Container] No provider found for "${tokenName}".\n` +
        (resolvingNames.length > 0
          ? `Dependency chain: ${resolvingNames.join(" -> ")} -> ${tokenName}\n`
          : "") +
        `Make sure you've added it to your module's providers array:\n` +
        `  providers: [${tokenName}.provider]`
      );
    }

    const { provider, owner } = lookup;

    // Value providers are always pre-cached
    if ("useValue" in provider) {
      return provider.useValue;
    }

    const lifetime = provider.lifetime ?? "singleton";

    // Return cached singleton if available
    if (lifetime === "singleton" && owner.instances.has(provider.provide)) {
      return owner.instances.get(provider.provide);
    }

    // Circular dependency detection
    if (resolving.has(provider.provide)) {
      const tokenName = this.getTokenName(provider.provide);
      const resolvingNames = Array.from(resolving).map(t => this.getTokenName(t));

      throw new Error(
        `[DI Container] Circular dependency detected!\n` +
        `Dependency chain: ${resolvingNames.join(" -> ")} -> ${tokenName}\n\n` +
        `This means these services depend on each other in a circle:\n` +
        resolvingNames.map((name, i) => `  ${i + 1}. ${name}`).join("\n") + "\n" +
        `  ${resolvingNames.length + 1}. ${tokenName} (tries to depend on step 1)\n\n` +
        `To fix this, consider:\n` +
        `  - Using lazy injection (getter function)\n` +
        `  - Extracting shared logic to a separate service\n` +
        `  - Restructuring your dependencies`
      );
    }

    // Mark as currently resolving
    resolving.add(provider.provide);

    try {
      const instance = this.instantiateProvider(provider, resolving);
      resolving.delete(provider.provide);

      // Cache singleton instances
      if (lifetime === "singleton") {
        owner.instances.set(provider.provide, instance);
      }

      return instance;
    } catch (error) {
      resolving.delete(provider.provide);
      throw error;
    }
  }

  /**
   * Instantiates a provider (class or factory)
   *
   * @param provider - The provider to instantiate
   * @param resolving - Set of currently resolving tokens for cycle detection
   * @returns The created instance
   *
   * @throws {Error} If instantiation fails
   * @throws {Error} If dependency count mismatch (factory providers)
   *
   * @remarks
   * For class providers:
   * - Dependencies from deps array or class.inject property
   * - Instantiated with new keyword
   *
   * For factory providers:
   * - Validates parameter count matches deps array
   * - Invoked as a function
   *
   * @internal
   */
  private instantiateProvider(provider: Provider, resolving: Set<Token>): any {
    if (isClassProvider(provider)) {
      const declaredDeps = provider.deps ?? getInjectTokens(provider.useClass) ?? [];
      const deps = this.resolveDependencies(declaredDeps, resolving);

      try {
        return new provider.useClass(...deps);
      } catch (error) {
        const tokenName = this.getTokenName(provider.provide);
        throw new Error(
          `[DI Container] Failed to instantiate "${tokenName}".\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n` +
          `Dependencies: [${declaredDeps.map(d => this.getTokenName(d)).join(", ")}]`
        );
      }
    }

    if (isFactoryProvider(provider)) {
      const declaredDeps = provider.deps ?? [];
      const deps = this.resolveDependencies(declaredDeps, resolving);

      // Validate dependency count matches factory parameters
      const expectedParams = provider.useFactory.length;
      if (expectedParams > 0 && deps.length !== expectedParams) {
        const tokenName = this.getTokenName(provider.provide);
        throw new Error(
          `[DI Container] Dependency count mismatch for "${tokenName}".\n` +
          `Factory function expects ${expectedParams} parameter(s), but ${deps.length} dependencies were provided.\n` +
          `Provided dependencies: [${declaredDeps.map(d => this.getTokenName(d)).join(", ")}]\n\n` +
          `Make sure your deps array matches your factory function parameters:\n` +
          `  defineInjectable(\n` +
          `    (dep1, dep2) => ({ ... }),\n` +
          `    [service1, service2]  // ← Must match parameter count\n` +
          `  )`
        );
      }

      try {
        return provider.useFactory(...deps);
      } catch (error) {
        const tokenName = this.getTokenName(provider.provide);
        throw new Error(
          `[DI Container] Failed to create "${tokenName}" from factory.\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n` +
          `Dependencies: [${declaredDeps.map(d => this.getTokenName(d)).join(", ")}]`
        );
      }
    }

    return provider.useValue;
  }

  /**
   * Resolves an array of dependency tokens to their instances
   *
   * @param depTokens - Array of tokens to resolve
   * @param resolving - Set of currently resolving tokens for cycle detection
   * @returns Array of resolved instances in the same order
   *
   * @internal
   */
  private resolveDependencies(depTokens: readonly Token[], resolving: Set<Token>): any[] {
    return depTokens.map((dep) => this.resolve(dep, resolving));
  }

  /**
   * Looks up a provider in this container or parent containers
   *
   * @param token - The token to look up
   * @returns The provider and owning container, or undefined if not found
   *
   * @remarks
   * Searches from child to parent (current container first)
   * Returns the owning container for proper singleton caching
   *
   * @internal
   */
  private lookupProvider(token: Token): ProviderLookup | undefined {
    if (this.providers.has(token)) {
      return { provider: this.providers.get(token)!, owner: this };
    }

    if (this.parent) {
      return this.parent.lookupProvider(token);
    }

    return undefined;
  }
}

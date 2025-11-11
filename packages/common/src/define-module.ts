import {
  DIContainer,
  type Provider,
  type Token,
  type InjectableLike,
} from "./di-container";
import type { InternalControllerDefinition } from "./define-controller";

/**
 * @internal
 */
type ControllerDefinition = InternalControllerDefinition;

/**
 * A token that can be exported from a module
 *
 * @remarks
 * Can be either a standard Token (string, symbol, constructor) or an Injectable object
 *
 * @public
 */
type ExportableToken = Token | InjectableLike;

/**
 * A module definition containing controllers, dependencies, and DI container
 *
 * @remarks
 * This is the return type of defineModule. It includes:
 * - controllers: Array of instantiated controllers
 * - imports: Modules this module depends on
 * - exports: Tokens this module makes available to other modules
 * - providers: Service providers registered in this module
 * - container: DI container with all providers registered
 *
 * @example
 * ```typescript
 * const usersModule = defineModule({
 *   controllers: [usersController],
 *   providers: [UsersService.provider],
 *   exports: [UsersService]
 * });
 *
 * // Use in another module
 * const appModule = defineModule({
 *   imports: [usersModule],
 *   controllers: [appController]
 * });
 * ```
 *
 * @public
 */
type ModuleDefinition = {
  /** Array of controller definitions with routes */
  controllers: ControllerDefinition[];
  /** Modules imported by this module */
  imports: ModuleDefinition[];
  /** Tokens exported for use by other modules */
  exports: ExportableToken[];
  /** Providers registered in this module */
  providers: Provider[];
  /** DI container with all providers and imports registered */
  container: DIContainer;
};

/**
 * Configuration for defining a module
 *
 * @remarks
 * All properties are optional, allowing flexible module composition.
 *
 * **Module organization patterns**:
 * - **Feature modules**: Group related controllers and services (e.g., users, posts)
 * - **Shared modules**: Export common services for reuse
 * - **Core module**: Application-wide singletons (config, database, logging)
 * - **Root module**: Top-level module that imports all feature modules
 *
 * @public
 */
interface ModuleConfig {
  /**
   * Array of controller factories
   *
   * @remarks
   * Controllers are instantiated with the module's DI container,
   * allowing them to access all registered providers and imported services.
   *
   * @example
   * ```typescript
   * controllers: [usersController, postsController]
   * ```
   */
  controllers?: ((container: DIContainer) => ControllerDefinition)[];

  /**
   * Modules to import
   *
   * @remarks
   * Only exported tokens from imported modules are available.
   * Providers are shared as singletons across modules.
   *
   * @example
   * ```typescript
   * imports: [databaseModule, authModule]
   * ```
   */
  imports?: ModuleDefinition[];

  /**
   * Tokens to export for use by other modules
   *
   * @remarks
   * Only exported tokens are accessible to modules that import this module.
   * Use exports to control module API surface.
   *
   * @example
   * ```typescript
   * exports: [UsersService, DatabaseService]
   * ```
   */
  exports?: ExportableToken[];

  /**
   * Service providers to register in this module
   *
   * @remarks
   * Providers are registered in the module's DI container.
   * Use Injectable.provider for services created with defineInjectable.
   *
   * @example
   * ```typescript
   * providers: [
   *   UsersService.provider,
   *   PostsService.provider,
   *   { provide: "CONFIG", useValue: config }
   * ]
   * ```
   */
  providers?: Provider[];
}

/**
 * Defines a module with controllers, services, and dependencies
 *
 * @param config - Module configuration
 * @returns ModuleDefinition with controllers, container, and metadata
 *
 * @remarks
 * Modules are the organizational unit of the application. They:
 * - Group related controllers and services
 * - Manage dependency injection scope
 * - Control provider visibility through exports
 * - Enable code organization and reusability
 *
 * **Module initialization flow**:
 * 1. Create a new DI container for this module
 * 2. Import and register exported providers from imported modules
 * 3. Register this module's own providers
 * 4. Instantiate controllers with access to all providers
 * 5. Return the module definition
 *
 * **Important**: All dependency resolution happens at module creation time,
 * not at request time. This ensures:
 * - Fast request handling (zero DI overhead)
 * - Early detection of missing dependencies
 * - Predictable singleton behavior
 *
 * **Best practices**:
 * - One module per feature or domain
 * - Export only the public API of your module
 * - Use shared modules for cross-cutting concerns
 * - Keep the root module minimal (just imports)
 *
 * **Security considerations**:
 * - Modules share singleton instances - avoid request-specific data
 * - Exported services are accessible to any importing module
 * - Use encapsulation to hide implementation details
 * - Validate module configuration at definition time
 *
 * @example
 * Feature module with service and controller:
 * ```typescript
 * export const usersModule = defineModule({
 *   controllers: [usersController],
 *   providers: [UsersService.provider],
 *   exports: [UsersService]  // Make UsersService available to other modules
 * });
 * ```
 *
 * @example
 * Shared module exporting multiple services:
 * ```typescript
 * export const databaseModule = defineModule({
 *   providers: [
 *     DatabaseService.provider,
 *     CacheService.provider
 *   ],
 *   exports: [DatabaseService, CacheService]
 * });
 * ```
 *
 * @example
 * Root module importing feature modules:
 * ```typescript
 * export const appModule = defineModule({
 *   imports: [
 *     databaseModule,
 *     usersModule,
 *     postsModule
 *   ],
 *   controllers: [healthController]
 * });
 * ```
 *
 * @example
 * Module with configuration:
 * ```typescript
 * const config = {
 *   apiUrl: "https://api.example.com",
 *   timeout: 5000
 * };
 *
 * export const appModule = defineModule({
 *   providers: [
 *     { provide: "CONFIG", useValue: config },
 *     ApiService.provider
 *   ],
 *   controllers: [apiController]
 * });
 * ```
 *
 * @public
 */
export function defineModule(config: ModuleConfig): ModuleDefinition {
  const {
    controllers = [],
    imports = [],
    exports: moduleExports = [],
    providers = [],
  } = config;

  // Create a new DI container for this module
  const container = new DIContainer();

  // Import providers from other modules
  // Only exported tokens are accessible (encapsulation)
  imports.forEach((importedModule) => {
    importedModule.exports.forEach((exportedToken) => {
      if (importedModule.container.has(exportedToken)) {
        // Share singleton instance from imported module
        // This ensures one instance across the entire application
        const instance = importedModule.container.get(exportedToken);
        container.registerValue(exportedToken, instance);
      }
    });
  });

  // Register this module's own providers
  container.registerMany(providers);

  // Instantiate controllers with dependency injection
  // Controllers can now access all providers (own + imported)
  // This happens at module creation time, not request time
  const controllerInstances = controllers.map((controllerFactory) => {
    return controllerFactory(container);
  });

  return {
    controllers: controllerInstances,
    imports,
    exports: moduleExports,
    providers,
    container,
  };
}

export type { ModuleDefinition, ModuleConfig };

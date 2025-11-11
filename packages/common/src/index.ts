// Main exports for the controller/module system
export { defineController } from "./define-controller";
export { defineModule } from "./define-module";
export { createApp } from "./create-app";
export { DIContainer } from "./di-container";
export { defineInjectable } from "./define-injectable";

// Type exports
export type { ModuleDefinition, ModuleConfig } from "./define-module";
export type { CreateAppOptions, KahelApp } from "./create-app";
export type {
  Injectable,
  InjectableConfig,
  InjectableToken,
  InferInjectable,
} from "./define-injectable";
export type {
  Provider,
  Token,
  Constructor,
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  Lifetime
} from "./di-container";

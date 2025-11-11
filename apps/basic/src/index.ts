/**
 * Basic KahelJS Example
 *
 * This example demonstrates:
 * - Creating a simple service
 * - Defining a controller
 * - Setting up a module
 * - Starting the server
 *
 * Project structure:
 * - greeting.service.ts - Business logic
 * - greeting.controller.ts - HTTP routes
 * - index.ts - Application bootstrap
 */

import { defineModule, createApp } from "@kaheljs/common";
import { GreetingService } from "./greeting.service";
import { greetingController } from "./greeting.controller";

// ============================================================================
// Module
// ============================================================================

/**
 * Application module
 * Combines controllers and services
 */
const appModule = defineModule({
  controllers: [greetingController],
  providers: [GreetingService.provider]
});

// ============================================================================
// Bootstrap
// ============================================================================

const app = createApp(appModule);

const port = 3000;

console.log(`🚀 Basic example running at http://localhost:${port}`);
console.log(`\nTry these routes:`);
console.log(`  GET  http://localhost:${port}/`);
console.log(`  GET  http://localhost:${port}/greet/John`);
console.log(`  GET  http://localhost:${port}/health`);

export default {
  port,
  fetch: app.fetch
};

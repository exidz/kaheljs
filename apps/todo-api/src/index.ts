/**
 * Todo API Application
 *
 * A RESTful API demonstrating:
 * - CRUD operations
 * - Service layer pattern
 * - Dependency injection
 * - Request validation
 * - Error handling
 */

import { defineModule, createApp } from "@kaheljs/common";
import { todoController } from "./todo.controller";
import { TodoService } from "./todo.service";

// ============================================================================
// Module
// ============================================================================

const appModule = defineModule({
  controllers: [todoController],
  providers: [TodoService.provider]
});

// ============================================================================
// Bootstrap
// ============================================================================

const app = createApp(appModule);

const port = 3001;

console.log(`🚀 Todo API running at http://localhost:${port}`);
console.log(`\nAvailable routes:`);
console.log(`  GET    /todos       - List all todos`);
console.log(`  GET    /todos/stats - Get statistics`);
console.log(`  GET    /todos/:id   - Get a todo by ID`);
console.log(`  POST   /todos       - Create a new todo`);
console.log(`  PUT    /todos/:id   - Update a todo`);
console.log(`  DELETE /todos/:id   - Delete a todo`);

export default {
  port,
  fetch: app.fetch
};

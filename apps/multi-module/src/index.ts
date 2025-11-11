/**
 * Multi-Module Application
 *
 * This example demonstrates:
 * - Module composition and organization
 * - Shared modules (databaseModule)
 * - Feature modules (usersModule, postsModule)
 * - Cross-module dependencies
 * - Module imports and exports
 *
 * Architecture:
 *
 *   appModule (root)
 *        ├── usersModule
 *        │   └── imports: databaseModule
 *        └── postsModule
 *            ├── imports: databaseModule
 *            └── imports: usersModule
 *
 * This structure shows:
 * - databaseModule is shared across multiple modules
 * - postsModule uses services from usersModule
 * - Clean separation of concerns
 */

import { defineModule, createApp } from "kaheljs";
import { usersModule } from "./users/users.module";
import { postsModule } from "./posts/posts.module";

// ============================================================================
// Root Module
// ============================================================================

/**
 * The root application module imports all feature modules.
 * It doesn't need to import databaseModule directly because
 * usersModule and postsModule already import it.
 */
const appModule = defineModule({
  imports: [usersModule, postsModule]
});

// ============================================================================
// Bootstrap
// ============================================================================

const app = createApp(appModule);

const port = 3002;

console.log(`🚀 Multi-Module example running at http://localhost:${port}`);
console.log(`\nModule Structure:`);
console.log(`  📦 appModule (root)`);
console.log(`     ├── 👥 usersModule`);
console.log(`     │   └── imports: databaseModule`);
console.log(`     └── 📝 postsModule`);
console.log(`         ├── imports: databaseModule`);
console.log(`         └── imports: usersModule`);
console.log(`\nAvailable routes:`);
console.log(`  Users:`);
console.log(`    GET    /users           - List all users`);
console.log(`    GET    /users/:id       - Get user by ID`);
console.log(`    POST   /users           - Create a user`);
console.log(`  Posts:`);
console.log(`    GET    /posts           - List all posts (with authors)`);
console.log(`    GET    /posts/:id       - Get post by ID`);
console.log(`    GET    /posts/user/:userId - Get posts by user`);
console.log(`    POST   /posts           - Create a post`);

export default {
  port,
  fetch: app.fetch
};

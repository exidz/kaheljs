/**
 * PostsModule - Feature module for post management
 *
 * Demonstrates:
 * - Importing multiple modules (databaseModule, usersModule)
 * - Using services from imported modules
 * - Complex dependencies between modules
 */

import { defineModule } from "@kaheljs/common";
import { databaseModule } from "../database/database.module";
import { usersModule } from "../users/users.module";
import { PostsService } from "./posts.service";
import { postsController } from "./posts.controller";

export const postsModule = defineModule({
  imports: [
    databaseModule, // Need DatabaseService
    usersModule     // Need UsersService
  ],
  controllers: [postsController],
  providers: [PostsService.provider]
});

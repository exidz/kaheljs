/**
 * UsersModule - Feature module for user management
 *
 * Demonstrates:
 * - Importing another module (databaseModule)
 * - Exporting a service for use in other modules
 * - Organizing controllers and services together
 */

import { defineModule } from "kaheljs";
import { databaseModule } from "../database/database.module";
import { UsersService } from "./users.service";
import { usersController } from "./users.controller";

export const usersModule = defineModule({
  imports: [databaseModule],        // Import database module to access DatabaseService
  controllers: [usersController],    // HTTP routes
  providers: [UsersService.provider],// Business logic
  exports: [UsersService]            // Export for use in other modules
});

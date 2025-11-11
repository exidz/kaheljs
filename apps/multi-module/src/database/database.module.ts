/**
 * DatabaseModule - Core infrastructure module
 *
 * This module provides database access to the entire application.
 * It exports DatabaseService so other modules can import and use it.
 */

import { defineModule } from "@kaheljs/common";
import { DatabaseService } from "./database.service";

export const databaseModule = defineModule({
  providers: [DatabaseService.provider],
  exports: [DatabaseService] // Make DatabaseService available to importing modules
});

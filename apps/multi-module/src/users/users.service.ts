/**
 * UsersService - Business logic for users
 *
 * Demonstrates:
 * - Service depending on another service (DatabaseService)
 * - Business logic layer
 * - Data transformation
 */

import { defineInjectable } from "@kaheljs/common";
import { DatabaseService } from "../database/database.service";

export const UsersService = defineInjectable(
  (db) => ({
    findAll: () => {
      const users = db.findAllUsers();
      return users.map(user => ({
        ...user,
        // Add computed field
        displayName: `${user.name} <${user.email}>`
      }));
    },

    findById: (id: number) => {
      const user = db.findUserById(id);
      if (!user) return undefined;

      return {
        ...user,
        displayName: `${user.name} <${user.email}>`,
        postCount: db.findPostsByUserId(id).length
      };
    },

    findByEmail: (email: string) => {
      return db.findUserByEmail(email);
    },

    create: (name: string, email: string) => {
      return db.createUser({ name, email });
    }
  }),
  [DatabaseService] as const
);

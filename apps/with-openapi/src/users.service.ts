/**
 * UsersService - User management with mock data
 *
 * Demonstrates:
 * - Service with CRUD operations
 * - Type-safe data handling
 */

import { defineInjectable } from "@kaheljs/common";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

export const UsersService = defineInjectable(() => {
  const users = new Map<number, User>([
    [1, { id: 1, name: "Alice", email: "alice@example.com", role: "admin" }],
    [2, { id: 2, name: "Bob", email: "bob@example.com", role: "user" }],
    [3, { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" }]
  ]);

  let nextId = 4;

  return {
    findAll: (): User[] => {
      return Array.from(users.values());
    },

    findById: (id: number): User | undefined => {
      return users.get(id);
    },

    create: (data: Omit<User, "id">): User => {
      const user: User = {
        id: nextId++,
        ...data
      };
      users.set(user.id, user);
      return user;
    },

    update: (id: number, data: Partial<Omit<User, "id">>): User | undefined => {
      const user = users.get(id);
      if (!user) return undefined;

      const updated = { ...user, ...data };
      users.set(id, updated);
      return updated;
    },

    delete: (id: number): boolean => {
      return users.delete(id);
    }
  };
});

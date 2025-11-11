/**
 * TodoService - Manages todo items
 *
 * This service demonstrates:
 * - In-memory data storage
 * - CRUD operations
 * - Business logic separation
 */

import { defineInjectable } from "@kaheljs/common";
import type { Todo, CreateTodoDto, UpdateTodoDto } from "./types";

export const TodoService = defineInjectable(() => {
  // In-memory storage
  const todos = new Map<number, Todo>();
  let nextId = 1;

  return {
    /**
     * Get all todos
     */
    findAll: (): Todo[] => {
      return Array.from(todos.values());
    },

    /**
     * Get a todo by ID
     */
    findById: (id: number): Todo | undefined => {
      return todos.get(id);
    },

    /**
     * Create a new todo
     */
    create: (dto: CreateTodoDto): Todo => {
      const todo: Todo = {
        id: nextId++,
        title: dto.title,
        description: dto.description,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      todos.set(todo.id, todo);
      return todo;
    },

    /**
     * Update an existing todo
     */
    update: (id: number, dto: UpdateTodoDto): Todo | undefined => {
      const todo = todos.get(id);
      if (!todo) return undefined;

      const updated: Todo = {
        ...todo,
        ...dto,
        updatedAt: new Date()
      };

      todos.set(id, updated);
      return updated;
    },

    /**
     * Delete a todo
     */
    delete: (id: number): boolean => {
      return todos.delete(id);
    },

    /**
     * Get statistics
     */
    getStats: () => {
      const all = Array.from(todos.values());
      return {
        total: all.length,
        completed: all.filter(t => t.completed).length,
        pending: all.filter(t => !t.completed).length
      };
    }
  };
});

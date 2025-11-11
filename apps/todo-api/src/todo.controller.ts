/**
 * TodoController - HTTP routes for todo operations
 *
 * This controller demonstrates:
 * - RESTful API design
 * - Service injection
 * - Request/response handling
 * - Validation and error handling
 */

import { defineController } from "kaheljs";
import { TodoService } from "./todo.service";
import type { CreateTodoDto, UpdateTodoDto } from "./types";

export const todoController = defineController("/todos", (r, deps) => {
  /**
   * GET /todos
   * List all todos
   */
  r.get("/", (c) => {
    const todoService = deps.get(TodoService);
    const todos = todoService.findAll();
    return c.json({ todos });
  });

  /**
   * GET /todos/stats
   * Get todo statistics
   */
  r.get("/stats", (c) => {
    const todoService = deps.get(TodoService);
    const stats = todoService.getStats();
    return c.json({ stats });
  });

  /**
   * GET /todos/:id
   * Get a specific todo by ID
   */
  r.get("/:id", (c) => {
    const todoService = deps.get(TodoService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid todo ID" }, 400);
    }

    const todo = todoService.findById(id);

    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ todo });
  });

  /**
   * POST /todos
   * Create a new todo
   */
  r.post("/", async (c) => {
    const todoService = deps.get(TodoService);

    try {
      const body = await c.req.json<CreateTodoDto>();

      // Validation
      if (!body.title || body.title.trim() === "") {
        return c.json({ error: "Title is required" }, 400);
      }

      const todo = todoService.create(body);
      return c.json({ todo }, 201);
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });

  /**
   * PUT /todos/:id
   * Update an existing todo
   */
  r.put("/:id", async (c) => {
    const todoService = deps.get(TodoService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid todo ID" }, 400);
    }

    try {
      const body = await c.req.json<UpdateTodoDto>();

      const todo = todoService.update(id, body);

      if (!todo) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json({ todo });
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });

  /**
   * DELETE /todos/:id
   * Delete a todo
   */
  r.delete("/:id", (c) => {
    const todoService = deps.get(TodoService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid todo ID" }, 400);
    }

    const deleted = todoService.delete(id);

    if (!deleted) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ message: "Todo deleted successfully" });
  });
});

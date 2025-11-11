/**
 * UsersController - RESTful user endpoints
 *
 * Demonstrates:
 * - Full CRUD operations
 * - Request/response handling
 * - Error responses
 */

import { defineController } from "kaheljs";
import { UsersService } from "./users.service";

export const usersController = defineController("/users", (r, deps) => {
  r.get("/", (c) => {
    const users = deps.get(UsersService);
    return c.json({
      users: users.findAll()
    });
  });

  r.get("/:id", (c) => {
    const users = deps.get(UsersService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const user = users.findById(id);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  });

  r.post("/", async (c) => {
    const users = deps.get(UsersService);

    try {
      const body = await c.req.json<{
        name: string;
        email: string;
        role: "admin" | "user";
      }>();

      if (!body.name || !body.email || !body.role) {
        return c.json({
          error: "Missing required fields: name, email, role"
        }, 400);
      }

      const user = users.create(body);
      return c.json({ user }, 201);
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });

  r.put("/:id", async (c) => {
    const users = deps.get(UsersService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    try {
      const body = await c.req.json<{
        name?: string;
        email?: string;
        role?: "admin" | "user";
      }>();

      const user = users.update(id, body);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({ user });
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });

  r.delete("/:id", (c) => {
    const users = deps.get(UsersService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const deleted = users.delete(id);

    if (!deleted) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "User deleted successfully" });
  });
});

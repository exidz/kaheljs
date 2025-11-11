/**
 * UsersController - HTTP routes for users
 *
 * Handles user-related HTTP requests
 */

import { defineController } from "kaheljs";
import { UsersService } from "./users.service";

export const usersController = defineController("/users", (r, deps) => {
  r.get("/", (c) => {
    const users = deps.get(UsersService);
    return c.json({ users: users.findAll() });
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
      const body = await c.req.json<{ name: string; email: string }>();

      if (!body.name || !body.email) {
        return c.json({ error: "Name and email are required" }, 400);
      }

      const user = users.create(body.name, body.email);
      return c.json({ user }, 201);
    } catch (error) {
      return c.json({ error: "Invalid request body" }, 400);
    }
  });
});

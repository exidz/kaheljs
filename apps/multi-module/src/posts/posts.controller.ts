/**
 * PostsController - HTTP routes for posts
 *
 * Handles post-related HTTP requests
 */

import { defineController } from "@kaheljs/common";
import { PostsService } from "./posts.service";

export const postsController = defineController("/posts", (r, deps) => {
  r.get("/", (c) => {
    const posts = deps.get(PostsService);
    return c.json({ posts: posts.findAll() });
  });

  r.get("/:id", (c) => {
    const posts = deps.get(PostsService);
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json({ error: "Invalid post ID" }, 400);
    }

    const post = posts.findById(id);

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json({ post });
  });

  r.get("/user/:userId", (c) => {
    const posts = deps.get(PostsService);
    const userId = Number(c.req.param("userId"));

    if (isNaN(userId)) {
      return c.json({ error: "Invalid user ID" }, 400);
    }

    const userPosts = posts.findByUserId(userId);
    return c.json({ posts: userPosts });
  });

  r.post("/", async (c) => {
    const posts = deps.get(PostsService);

    try {
      const body = await c.req.json<{
        userId: number;
        title: string;
        content: string;
      }>();

      if (!body.userId || !body.title || !body.content) {
        return c.json({
          error: "userId, title, and content are required"
        }, 400);
      }

      const post = posts.create(body.userId, body.title, body.content);
      return c.json({ post }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request";
      return c.json({ error: message }, 400);
    }
  });
});

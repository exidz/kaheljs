/**
 * PostsService - Business logic for posts
 *
 * Demonstrates:
 * - Service depending on multiple services
 * - Cross-module dependencies (uses UsersService from users module)
 * - Data enrichment
 */

import { defineInjectable } from "@kaheljs/common";
import { DatabaseService } from "../database/database.service";
import { UsersService } from "../users/users.service";

export const PostsService = defineInjectable(
  (db, users) => ({
    findAll: () => {
      const posts = db.findAllPosts();

      // Enrich posts with author information
      return posts.map(post => ({
        ...post,
        author: users.findById(post.userId)
      }));
    },

    findById: (id: number) => {
      const post = db.findPostById(id);
      if (!post) return undefined;

      return {
        ...post,
        author: users.findById(post.userId)
      };
    },

    findByUserId: (userId: number) => {
      const posts = db.findPostsByUserId(userId);

      return posts.map(post => ({
        ...post,
        author: users.findById(userId)
      }));
    },

    create: (userId: number, title: string, content: string) => {
      const user = users.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      return db.createPost({ userId, title, content });
    }
  }),
  [DatabaseService, UsersService] as const
);

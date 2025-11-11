/**
 * DatabaseService - SQLite database operations
 *
 * This is a shared service that will be used by multiple modules.
 * Uses bun:sqlite (built into Bun runtime) for persistent storage.
 */

import { Database } from "bun:sqlite";
import { defineInjectable } from "kaheljs";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
}

export const DatabaseService = defineInjectable(() => {
  // Initialize SQLite database (in-memory for this example, but can be persistent)
  const db = new Database(":memory:");

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Seed initial data
  const insertUser = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  const insertPost = db.prepare("INSERT INTO posts (userId, title, content) VALUES (?, ?, ?)");

  insertUser.run("Alice", "alice@example.com");
  insertUser.run("Bob", "bob@example.com");
  insertUser.run("Charlie", "charlie@example.com");

  insertPost.run(1, "First Post", "Hello World!");
  insertPost.run(1, "Second Post", "Learning KahelJS");
  insertPost.run(2, "Bob's Post", "This is great!");

  // Prepare statements
  const findAllUsersStmt = db.prepare("SELECT * FROM users");
  const findUserByIdStmt = db.prepare("SELECT * FROM users WHERE id = ?");
  const findUserByEmailStmt = db.prepare("SELECT * FROM users WHERE email = ?");
  const createUserStmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?) RETURNING *");

  const findAllPostsStmt = db.prepare("SELECT * FROM posts");
  const findPostByIdStmt = db.prepare("SELECT * FROM posts WHERE id = ?");
  const findPostsByUserIdStmt = db.prepare("SELECT * FROM posts WHERE userId = ?");
  const createPostStmt = db.prepare("INSERT INTO posts (userId, title, content) VALUES (?, ?, ?) RETURNING *");

  return {
    // User queries
    findAllUsers: (): User[] => {
      return findAllUsersStmt.all() as User[];
    },

    findUserById: (id: number): User | undefined => {
      return findUserByIdStmt.get(id) as User | undefined;
    },

    findUserByEmail: (email: string): User | undefined => {
      return findUserByEmailStmt.get(email) as User | undefined;
    },

    // Post queries
    findAllPosts: (): Post[] => {
      return findAllPostsStmt.all() as Post[];
    },

    findPostById: (id: number): Post | undefined => {
      return findPostByIdStmt.get(id) as Post | undefined;
    },

    findPostsByUserId: (userId: number): Post[] => {
      return findPostsByUserIdStmt.all(userId) as Post[];
    },

    // Mutations
    createUser: (data: Omit<User, "id">): User => {
      return createUserStmt.get(data.name, data.email) as User;
    },

    createPost: (data: Omit<Post, "id">): Post => {
      return createPostStmt.get(data.userId, data.title, data.content) as Post;
    },

    // Close database connection (useful for cleanup)
    close: () => {
      db.close();
    }
  };
});

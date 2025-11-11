/**
 * OpenAPI with Scalar Example
 *
 * Demonstrates:
 * - OpenAPI specification
 * - API documentation with Scalar
 * - RESTful API design
 * - Integration with KahelJS
 */

import { defineModule, createApp } from "kaheljs";
import { apiReference } from "@scalar/hono-api-reference";
import { usersController } from "./users.controller";
import { UsersService } from "./users.service";

// ============================================================================
// Module
// ============================================================================

const appModule = defineModule({
  controllers: [usersController],
  providers: [UsersService.provider]
});

// ============================================================================
// Bootstrap
// ============================================================================

const app = createApp(appModule);

// ============================================================================
// OpenAPI Specification
// ============================================================================

/**
 * OpenAPI 3.0 specification for the API
 * This defines all endpoints, request/response schemas, and documentation
 */
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "KahelJS Users API",
    version: "1.0.0",
    description: "A RESTful API for user management built with KahelJS",
    contact: {
      name: "API Support",
      email: "support@example.com"
    }
  },
  servers: [
    {
      url: "http://localhost:3004",
      description: "Development server"
    }
  ],
  tags: [
    {
      name: "Users",
      description: "User management endpoints"
    }
  ],
  paths: {
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List all users",
        description: "Retrieve a list of all users in the system",
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Create a new user",
        description: "Create a new user with the provided information",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request body",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        description: "Retrieve a single user by their ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID"
          }
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        description: "Update an existing user's information",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user",
        description: "Delete a user by their ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            description: "User ID"
          }
        ],
        responses: {
          "200": {
            description: "User deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "name", "email", "role"],
        properties: {
          id: {
            type: "integer",
            description: "User's unique identifier",
            example: 1
          },
          name: {
            type: "string",
            description: "User's full name",
            example: "Alice Johnson"
          },
          email: {
            type: "string",
            format: "email",
            description: "User's email address",
            example: "alice@example.com"
          },
          role: {
            type: "string",
            enum: ["admin", "user"],
            description: "User's role in the system",
            example: "user"
          }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["name", "email", "role"],
        properties: {
          name: {
            type: "string",
            description: "User's full name",
            example: "Alice Johnson"
          },
          email: {
            type: "string",
            format: "email",
            description: "User's email address",
            example: "alice@example.com"
          },
          role: {
            type: "string",
            enum: ["admin", "user"],
            description: "User's role",
            example: "user"
          }
        }
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "User's full name",
            example: "Alice Johnson"
          },
          email: {
            type: "string",
            format: "email",
            description: "User's email address",
            example: "alice@example.com"
          },
          role: {
            type: "string",
            enum: ["admin", "user"],
            description: "User's role",
            example: "user"
          }
        }
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            description: "Error message",
            example: "User not found"
          }
        }
      }
    }
  }
};

// ============================================================================
// OpenAPI Endpoints
// ============================================================================

// Serve OpenAPI spec as JSON
app.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});

// Serve API documentation with Scalar
app.get(
  "/docs",
  apiReference({
    spec: {
      content: openApiSpec
    },
    theme: "purple",
    pageTitle: "KahelJS Users API Documentation"
  })
);

// Redirect root to docs
app.get("/", (c) => {
  return c.redirect("/docs");
});

// ============================================================================
// Start Server
// ============================================================================

const port = 3004;

console.log(`🚀 OpenAPI example running at http://localhost:${port}`);
console.log(`\nAPI Documentation:`);
console.log(`  📚 Scalar UI:      http://localhost:${port}/docs`);
console.log(`  📄 OpenAPI Spec:   http://localhost:${port}/openapi.json`);
console.log(`\nAPI Endpoints:`);
console.log(`  GET    /users       - List all users`);
console.log(`  GET    /users/:id   - Get user by ID`);
console.log(`  POST   /users       - Create a new user`);
console.log(`  PUT    /users/:id   - Update a user`);
console.log(`  DELETE /users/:id   - Delete a user`);

export default {
  port,
  fetch: app.fetch
};

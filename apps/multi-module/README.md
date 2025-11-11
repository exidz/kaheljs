# Multi-Module Example

A comprehensive example demonstrating module composition, imports/exports, and SQLite integration.

## Features

- ✅ Module composition and organization
- ✅ Shared module pattern (DatabaseModule)
- ✅ Feature modules (UsersModule, PostsModule)
- ✅ Cross-module dependencies
- ✅ SQLite database with bun:sqlite
- ✅ Prepared statements for performance
- ✅ Clean separation of concerns

## Project Structure

```
src/
  ├── index.ts                      # Application bootstrap
  ├── database/
  │   ├── database.service.ts       # SQLite service (shared)
  │   └── database.module.ts        # Core infrastructure module
  ├── users/
  │   ├── users.service.ts          # User business logic
  │   ├── users.controller.ts       # User HTTP routes
  │   └── users.module.ts           # Users feature module
  └── posts/
      ├── posts.service.ts          # Post business logic
      ├── posts.controller.ts       # Post HTTP routes
      └── posts.module.ts           # Posts feature module
```

## Module Architecture

```
appModule (root)
├── usersModule
│   └── imports: databaseModule
└── postsModule
    ├── imports: databaseModule
    └── imports: usersModule (for author info)
```

**Key Points:**
- `databaseModule` is shared across multiple modules
- `postsModule` depends on `usersModule` to enrich posts with author information
- Clean separation between core infrastructure and features

## Running

```bash
# Install dependencies (from root)
bun install

# Run in development mode (with hot reload)
bun run dev

# Run in production mode
bun run start
```

## API Endpoints

### Users API

```bash
# List all users
curl http://localhost:3002/users

# Get user by ID (includes post count)
curl http://localhost:3002/users/1

# Create a new user
curl -X POST http://localhost:3002/users \
  -H "Content-Type: application/json" \
  -d '{"name": "David", "email": "david@example.com"}'
```

### Posts API

```bash
# List all posts (with author information)
curl http://localhost:3002/posts

# Get post by ID
curl http://localhost:3002/posts/1

# Get posts by user
curl http://localhost:3002/posts/user/1

# Create a new post
curl -X POST http://localhost:3002/posts \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "New Post", "content": "Amazing content!"}'
```

## What You'll Learn

1. **Module Organization**: How to structure large applications with multiple modules
2. **Shared Modules**: Creating infrastructure modules used across features
3. **Module Imports**: How modules import and use services from other modules
4. **Module Exports**: Making services available to other modules
5. **SQLite Integration**: Using bun:sqlite for persistent storage
6. **Prepared Statements**: Optimizing database queries
7. **Cross-Module Dependencies**: Services depending on services from other modules

## Database

This example uses SQLite via `bun:sqlite` (built into Bun):

- **In-memory database** for quick testing (`:memory:`)
- Can be changed to persistent storage: `new Database("app.db")`
- Prepared statements for performance
- Proper foreign key constraints

### Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

-- Posts table
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## Dependency Flow

```
HTTP Request → Controller → Service → DatabaseService → SQLite
```

Example for `GET /posts`:
1. `postsController` receives request
2. Gets `PostsService` via DI
3. `PostsService` uses `DatabaseService` to fetch posts
4. `PostsService` uses `UsersService` to enrich with author info
5. Response sent back with complete data

## Next Steps

Try these examples next:
- **with-middleware** - Add authentication, logging, and more
- **testing-example** - Comprehensive testing with mocks

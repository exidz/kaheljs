# Todo API Example

A RESTful CRUD API built with KahelJS demonstrating real-world patterns.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Service layer pattern
- ✅ Dependency injection
- ✅ Request validation
- ✅ Error handling
- ✅ Statistics endpoint
- ✅ In-memory storage

## Project Structure

```
src/
  ├── index.ts            # Application bootstrap
  ├── types.ts            # TypeScript type definitions
  ├── todo.service.ts     # Business logic layer
  └── todo.controller.ts  # HTTP routes layer
```

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

### List all todos
```bash
curl http://localhost:3001/todos
```

### Get statistics
```bash
curl http://localhost:3001/todos/stats
```

### Get a specific todo
```bash
curl http://localhost:3001/todos/1
```

### Create a new todo
```bash
curl -X POST http://localhost:3001/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

### Update a todo
```bash
curl -X PUT http://localhost:3001/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete a todo
```bash
curl -X DELETE http://localhost:3001/todos/1
```

## What You'll Learn

1. **Service Layer Pattern**: Separate business logic from HTTP handling
2. **CRUD Operations**: Complete Create, Read, Update, Delete flow
3. **Dependency Injection**: TodoService injected into TodoController
4. **Type Safety**: TypeScript interfaces for DTOs and entities
5. **Request Validation**: Input validation and error responses
6. **RESTful Design**: Proper HTTP methods and status codes

## Architecture

```
HTTP Request
    ↓
Controller (todo.controller.ts)
    ├─ Route handling
    ├─ Request validation
    └─ Response formatting
    ↓
Service (todo.service.ts)
    ├─ Business logic
    ├─ Data validation
    └─ Data persistence
    ↓
Storage (in-memory Map)
```

## Next Steps

Try these examples next:
- **multi-module** - See how to organize large applications
- **with-middleware** - Add authentication and logging
- **testing-example** - Learn comprehensive testing

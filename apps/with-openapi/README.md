# OpenAPI with Scalar Example

A complete OpenAPI example with beautiful API documentation using Scalar.

## Features

- ✅ Complete OpenAPI 3.0 specification
- ✅ Beautiful API documentation with Scalar
- ✅ RESTful CRUD API
- ✅ Request/response schemas
- ✅ Interactive API testing
- ✅ No code generation required

## Project Structure

```
src/
  ├── users.service.ts      # User business logic
  ├── users.controller.ts   # HTTP routes
  └── index.ts              # App bootstrap + OpenAPI spec
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

## Exploring the API

### 📚 API Documentation (Scalar UI)
Open in your browser: **http://localhost:3004/docs**

Features:
- Beautiful, modern UI
- Interactive request builder
- Try out API calls directly from the browser
- Code examples in multiple languages
- Full schema documentation

### 📄 OpenAPI Specification
View the raw OpenAPI JSON: **http://localhost:3004/openapi.json**

## API Endpoints

### List Users
```bash
curl http://localhost:3004/users
```

### Get User by ID
```bash
curl http://localhost:3004/users/1
```

### Create User
```bash
curl -X POST http://localhost:3004/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "David Miller",
    "email": "david@example.com",
    "role": "user"
  }'
```

### Update User
```bash
curl -X PUT http://localhost:3004/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "role": "admin"
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:3004/users/1
```

## What You'll Learn

1. **OpenAPI Specification**: How to write comprehensive API documentation
2. **Scalar Integration**: Modern API documentation UI
3. **Schema Definitions**: Reusable component schemas
4. **Request/Response Types**: Proper API contract definition
5. **Error Handling**: Documented error responses
6. **REST Best Practices**: Proper HTTP methods and status codes

## OpenAPI Features Demonstrated

### Complete API Documentation
- Info, contact, and server configuration
- Tags for endpoint organization
- Operation summaries and descriptions

### Schema Definitions
- Reusable component schemas
- Required fields and validation
- Examples and descriptions
- Enum types

### Request/Response Handling
- Request body schemas
- Response schemas by status code
- Path parameters
- Query parameters (easily added)

### Interactive Documentation
- Try API calls from the browser
- Code generation in multiple languages
- Request/response examples
- Authentication (easily added)

## Why Scalar?

Scalar provides:
- 🎨 Modern, beautiful UI
- 🚀 Fast and responsive
- 💼 Professional appearance
- 🔧 Easy to customize
- 📱 Mobile-friendly
- 🌙 Dark mode support

## Customization

### Change Theme
```typescript
apiReference({
  spec: { content: openApiSpec },
  theme: "purple",  // Options: "purple", "blue", "green", "orange", "default"
  pageTitle: "My API Docs"
})
```

### Add Authentication
Update the OpenAPI spec:
```typescript
components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  }
},
security: [{ bearerAuth: [] }]
```

## Next Steps

- Add more endpoints and schemas
- Integrate authentication
- Add request validation with Zod
- Deploy with proper domains
- Version your API

## Resources

- [Scalar Documentation](https://scalar.com/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Hono Examples](https://hono.dev/examples)

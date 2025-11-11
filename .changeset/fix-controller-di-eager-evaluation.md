---
"kaheljs": patch
"kaheljs-test": patch
---

Fix controller dependency injection eager evaluation bug

Controllers now use lazy evaluation for default instances, preventing the setup function from being called with an empty DI container. This fixes the recommended pattern of resolving services once at controller creation time instead of per-request.

Testing module also updated to delay module creation until after overrides are applied, ensuring mocked services are available during controller instantiation.

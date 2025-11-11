/**
 * Basic Example Tests
 *
 * Demonstrates:
 * - Testing services in isolation
 * - Testing controllers with HTTP requests
 * - Using the test module utilities
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { createTestingModule, createMock } from "kaheljs-test";
import { GreetingService } from "./greeting.service";
import { greetingController } from "./greeting.controller";

describe("Basic Example Tests", () => {
  /**
   * Test: Service works in isolation
   *
   * Services can be tested directly by calling their factory
   */
  test("GreetingService returns correct greeting", () => {
    // Create service instance directly
    const service = GreetingService.factory();

    // Test default greeting
    expect(service.getGreeting()).toBe("Hello, World!");

    // Test personalized greeting
    expect(service.getGreeting("John")).toBe("Hello, John!");
  });

  test("GreetingService returns app info", () => {
    const service = GreetingService.factory();
    const info = service.getInfo();

    expect(info.app).toBe("KahelJS Basic Example");
    expect(info.version).toBe("1.0.0");
    expect(info.framework).toBe("KahelJS + Hono");
  });

  /**
   * Test: Controller with real service
   */
  describe("Controller Integration Tests", () => {
    let app: any;

    beforeAll(() => {
      // Create testing module with real service
      const testModule = createTestingModule({
        controllers: [greetingController],
        providers: [GreetingService.provider]
      });

      app = testModule.createApp();
    });

    test("GET / returns greeting and info", async () => {
      const res = await app.request("/");

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.message).toBe("Hello, World!");
      expect(json.info).toBeDefined();
      expect(json.info.app).toBe("KahelJS Basic Example");
    });

    test("GET /greet/:name returns personalized greeting", async () => {
      const res = await app.request("/greet/Alice");

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.message).toBe("Hello, Alice!");
    });

    test("GET /health returns ok status", async () => {
      const res = await app.request("/health");

      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.timestamp).toBeDefined();
    });
  });

  /**
   * Test: Controller with mocked service
   */
  describe("Controller with Mock Service", () => {
    test("GET / with mocked greeting", async () => {
      const testModule = createTestingModule({
        controllers: [greetingController],
        providers: [GreetingService.provider]
      });

      // Override with mock
      testModule.override(GreetingService, createMock({
        getGreeting: () => "Mocked Hello!",
        getInfo: () => ({
          app: "Mocked App",
          version: "0.0.0",
          framework: "Test Framework"
        })
      }));

      const app = testModule.createApp();
      const res = await app.request("/");
      const json = await res.json();

      expect(json.message).toBe("Mocked Hello!");
      expect(json.info.app).toBe("Mocked App");
    });

    test("GET /greet/:name with mocked response", async () => {
      const testModule = createTestingModule({
        controllers: [greetingController],
        providers: [GreetingService.provider]
      });

      // Mock to always return the same greeting regardless of name
      testModule.override(GreetingService, createMock({
        getGreeting: () => "Custom Greeting",
        getInfo: () => ({ app: "", version: "", framework: "" })
      }));

      const app = testModule.createApp();
      const res = await app.request("/greet/Anyone");
      const json = await res.json();

      expect(json.message).toBe("Custom Greeting");
    });
  });

  /**
   * Test: Error cases
   */
  describe("Error Handling", () => {
    let app: any;

    beforeAll(() => {
      const testModule = createTestingModule({
        controllers: [greetingController],
        providers: [GreetingService.provider]
      });
      app = testModule.createApp();
    });

    test("GET /nonexistent returns 404", async () => {
      const res = await app.request("/nonexistent");
      expect(res.status).toBe(404);
    });

    test("POST / returns 404 (method not allowed)", async () => {
      const res = await app.request("/", { method: "POST" });
      expect(res.status).toBe(404);
    });
  });
});

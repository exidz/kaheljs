/**
 * GreetingController - HTTP routes for greetings
 *
 * Demonstrates:
 * - Defining routes with defineController
 * - Injecting services via deps.get()
 * - Handling path parameters
 * - Returning JSON responses
 */

import { defineController } from "kaheljs";
import { GreetingService } from "./greeting.service";

export const greetingController = defineController("/", (r, deps) => {
  /**
   * GET /
   * Returns a default greeting with app info
   */
  r.get("/", (c) => {
    const greeting = deps.get(GreetingService);
    return c.json({
      message: greeting.getGreeting(),
      info: greeting.getInfo()
    });
  });

  /**
   * GET /greet/:name
   * Returns a personalized greeting
   */
  r.get("/greet/:name", (c) => {
    const greeting = deps.get(GreetingService);
    const name = c.req.param("name");
    return c.json({
      message: greeting.getGreeting(name)
    });
  });

  /**
   * GET /health
   * Health check endpoint
   */
  r.get("/health", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });
});

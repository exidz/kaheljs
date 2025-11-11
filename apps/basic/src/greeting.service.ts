/**
 * GreetingService - Simple greeting service
 *
 * Demonstrates:
 * - Creating a service with no dependencies
 * - Service methods returning different data types
 * - Pure business logic
 */

import { defineInjectable } from "@kaheljs/common";

export const GreetingService = defineInjectable(() => ({
  /**
   * Get a greeting message
   * @param name - Optional name for personalized greeting
   * @returns Greeting message
   */
  getGreeting: (name?: string): string => {
    return name ? `Hello, ${name}!` : "Hello, World!";
  },

  /**
   * Get application information
   * @returns App info object
   */
  getInfo: () => ({
    app: "KahelJS Basic Example",
    version: "1.0.0",
    framework: "KahelJS + Hono"
  })
}));

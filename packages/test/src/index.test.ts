import { describe, test, expect } from "bun:test";
import { defineInjectable, defineController, defineModule } from "@kaheljs/common";
import {
  createTestingModule,
  createMock,
  createMockFn,
  createFactory,
  spyOn,
  waitFor,
  request,
  expect as testExpect
} from "./index";

describe("@kaheljs/test - Smoke Tests", () => {
  test("createTestingModule works", () => {
    const TestService = defineInjectable(() => ({ test: true }));

    const testModule = createTestingModule({
      providers: [TestService.provider]
    });

    expect(testModule).toBeDefined();
    expect(testModule.container).toBeDefined();
    expect(testModule.get).toBeTypeOf("function");
    expect(testModule.override).toBeTypeOf("function");
    expect(testModule.createApp).toBeTypeOf("function");
  });

  test("createMock creates mock object", () => {
    const mock = createMock<{ getValue: () => string }>({
      getValue: () => "mocked"
    });

    expect(mock.getValue()).toBe("mocked");
  });

  test("createMockFn tracks calls", () => {
    const mockFn = createMockFn<(x: number) => number>();
    mockFn.mockReturnValue(42);

    const result = mockFn(10);

    expect(result).toBe(42);
    expect(mockFn.calls).toHaveLength(1);
    expect(mockFn.calls[0]).toEqual([10]);
  });

  test("createFactory generates fixtures", () => {
    const UserFactory = createFactory({
      id: 1,
      name: "Test User"
    });

    const user1 = UserFactory.build();
    const user2 = UserFactory.build({ name: "Custom" });

    expect(user1.id).toBe(1);
    expect(user2.id).toBe(2);
    expect(user2.name).toBe("Custom");
  });

  test("spyOn tracks function calls", () => {
    const obj = {
      getValue: () => "original"
    };

    const spy = spyOn(obj, "getValue");

    const result = obj.getValue();

    expect(result).toBe("original");
    expect(spy.calls).toHaveLength(1);
  });

  test("waitFor works", async () => {
    let counter = 0;

    setTimeout(() => {
      counter = 1;
    }, 50);

    await waitFor(() => counter === 1, 1000);

    expect(counter).toBe(1);
  });

  test("request builder works", async () => {
    const TestService = defineInjectable(() => ({
      getData: () => ({ message: "test" })
    }));

    const testController = defineController("/test", (r, deps) => {
      r.get("/", (c) => {
        const service = deps.get(TestService);
        return c.json(service.getData());
      });
    });

    const testModule = createTestingModule({
      controllers: [testController],
      providers: [TestService.provider]
    });

    const app = testModule.createApp();

    const res = await request(app).get("/test");

    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.message).toBe("test");
  });

  test("testExpect assertions work", async () => {
    const testController = defineController("/test", (r) => {
      r.get("/", (c) => c.json({ success: true }));
    });

    const testModule = createTestingModule({
      controllers: [testController]
    });

    const app = testModule.createApp();
    const res = await app.request("/test");

    testExpect.status(res, 200);
    testExpect.ok(res);
    testExpect.contentType(res, "application/json");
    await testExpect.json(res, { success: true });
  });

  test("override service in test module", async () => {
    const DataService = defineInjectable(() => ({
      getData: (): string => "real"
    }));

    const testController = defineController("/data", (r, deps) => {
      r.get("/", (c) => {
        const service = deps.get(DataService);
        return c.json({ data: service.getData() });
      });
    });

    const testModule = createTestingModule({
      controllers: [testController],
      providers: [DataService.provider]
    });

    // Override with mock using createMock for type safety
    testModule.override(DataService, createMock({
      getData: () => "mocked"
    }));

    const app = testModule.createApp();
    const res = await app.request("/data");
    const json = await res.json();

    expect(json.data).toBe("mocked");
  });
});

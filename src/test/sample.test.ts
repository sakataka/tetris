import { expect, test } from "bun:test";

test("sample test - testing environment works", () => {
  expect(1 + 1).toBe(2);
});

test("DOM globals are available", () => {
  expect(global.window).toBeDefined();
  expect(global.document).toBeDefined();
  expect(global.navigator).toBeDefined();
});

test("DOM manipulation works", () => {
  const div = global.document.createElement("div");
  div.textContent = "Hello, World!";
  global.document.body.appendChild(div);

  expect(global.document.body.children.length).toBe(1);
  expect(div.textContent).toBe("Hello, World!");
});

import { afterEach, beforeAll } from "bun:test";
import { Window } from "happy-dom";
import "@testing-library/jest-dom";

beforeAll(() => {
  const window = new Window();

  // Set up DOM globals - disable strict type checking for test environment
  // @ts-ignore
  global.window = window;
  // @ts-ignore
  global.document = window.document;
  // @ts-ignore
  global.navigator = window.navigator;
  // @ts-ignore
  global.location = window.location;
  // @ts-ignore
  global.HTMLElement = window.HTMLElement;
  // @ts-ignore
  global.Element = window.Element;
  // @ts-ignore
  global.Node = window.Node;
  global.localStorage = window.localStorage;

  // Set up additional globals for React testing
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16);
  };

  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
});

afterEach(() => {
  // Clean up DOM after each test
  if (global.document) {
    global.document.body.innerHTML = "";
  }
});

// Bootstrap a jsdom browser environment BEFORE react / react-dom load,
// because react-dom's module body reads `window.event` at init time.
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<!doctype html><html><body><div id="app"></div></body></html>`, {
  pretendToBeVisual: true, // provides requestAnimationFrame
  url: "http://localhost/",
});

const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);

export { window };
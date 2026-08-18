// dsh-keyboard-history — behavioral verification harness.
//
// Runs the real lib/client.js bundle in a VM over a jsdom window, mounts the
// registered slot component with simulated session standard kit
// (useSession / useInput / inputActions) and asserts the ↑/↓ state machine
// with real DOM KeyboardEvents on the composer textarea.
//
// Usage: npm run verify
import { window } from "./_env.mjs"; // MUST be the first import: installs jsdom globals
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const clientBundle = fs.readFileSync(path.join(repoRoot, "lib/client.js"), "utf8");

const factories = new Map();
window.__ModuleLoader__ = { load: (h) => factories.set(h.id, h.factory) };

vm.runInNewContext(clientBundle, {
  window,
  document: window.document,
  requestAnimationFrame: window.requestAnimationFrame,
});

const plugin = factories.get("dsh-keyboard-history");
if (!plugin) throw new Error("bundle did not register the dsh-keyboard-history factory");

const exportsObj = plugin((spec) => {
  if (spec === "react") return React;
  throw new Error(`unexpected require("${spec}")`);
});
if (typeof exportsObj?.apply !== "function") throw new Error("client bundle must export apply");

// capture the slot component through apply(), mimicking seat composition
let Component;
const fakeCtx = {
  slots: {
    inject(seat, factory) {
      if (seat !== "conversation.input.overlay") throw new Error(`unexpected seat ${seat}`);
      return factory();
    },
    register(opts, comp) {
      if (opts.name !== "conversation.input.overlay") throw new Error(`unexpected slot name ${opts.name}`);
      if (typeof opts.id !== "string" || typeof opts.order !== "number") throw new Error("slot registration must carry id and order");
      Component = comp;
      return () => {};
    },
  },
};
exportsObj.apply(fakeCtx);
if (typeof Component !== "function") throw new Error("slot component was never registered");

// ---------------------------------------------------------------------------
// session standard kit simulation (minimal store with subscriber re-render)
// ---------------------------------------------------------------------------
function makeStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set: (value) => {
      state = value;
      for (const fn of [...listeners]) fn();
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

const inputStore = makeStore({ draft: "", phase: "plain" });
const nodesStore = makeStore([]); // simulated ConversationSnapshot.nodes

function useSession(selector) {
  const [v, setV] = React.useState(() => selector({ nodes: nodesStore.get() }));
  React.useEffect(() => nodesStore.subscribe(() => setV(selector({ nodes: nodesStore.get() }))), []);
  return v;
}
function useInput(selector) {
  const [v, setV] = React.useState(() => selector(inputStore.get()));
  React.useEffect(() => inputStore.subscribe(() => setV(selector(inputStore.get()))), []);
  return v;
}
const inputActions = {
  setDraft(text) {
    // mirror the machine: full draft write + clear on empty is how send works
    inputStore.set({ ...inputStore.get(), draft: text });
  },
};

// ---------------------------------------------------------------------------
// DOM: composer card + textarea
// ---------------------------------------------------------------------------
const card = window.document.createElement("div");
card.setAttribute("data-composer-card", "true");
const textarea = window.document.createElement("textarea");
card.appendChild(textarea);
window.document.body.appendChild(card);

// ---------------------------------------------------------------------------
// test scaffolding
// ---------------------------------------------------------------------------
let failures = 0;
let checks = 0;
function ok(cond, label) {
  checks++;
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.error(`  FAIL ${label}`);
  }
}
function press(key, opts = {}) {
  const ev = new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts });
  textarea.focus();
  act(() => textarea.dispatchEvent(ev));
}
function setNodes(nodes) {
  act(() => nodesStore.set(nodes));
}
function setInput(patch) {
  act(() => inputStore.set({ ...inputStore.get(), ...patch }));
}
function render() {
  const root = createRoot(window.document.getElementById("app"));
  act(() => root.render(React.createElement(Component, { useSession, useInput, inputActions })));
  return root;
}

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------
console.log("dsh-keyboard-history behavior verification");
const root = render();
const draft = () => inputStore.get().draft;

// ── recall basics ──
setNodes([
  { kind: "user", content: [{ type: "text", text: "first message" }] },
  { kind: "user", content: [{ type: "text", text: "second message" }] },
  { kind: "assistant", content: [{ type: "text", text: "ignored" }] },
]);
press("ArrowUp");
ok(draft() === "second message", "↑ on empty draft recalls the newest message");
press("ArrowUp");
ok(draft() === "first message", "second ↑ walks older");
press("ArrowDown");
ok(draft() === "second message", "↓ walks newer");
press("ArrowDown");
ok(draft() === "", "↓ past the newest restores an empty draft");
press("ArrowUp");
ok(draft() === "second message", "re-↑ after exit starts from the newest again");

// ── non-empty draft is never touched ──
setInput({ draft: "half typed" });
press("ArrowUp");
ok(draft() === "half typed", "↑ with a non-empty draft leaves it untouched");
setInput({ draft: "", phase: "plain" });

// ── busy phase is ignored ──
setInput({ draft: "", phase: "submitting" });
press("ArrowUp");
ok(draft() === "", "↑ during a busy phase is ignored");
setInput({ draft: "", phase: "plain" });

// ── IME composition is ignored ──
press("ArrowUp", { isComposing: true });
ok(draft() === "", "↑ during IME composition is ignored");
press("ArrowUp", { isComposing: false, keyCode: 229 });
ok(draft() === "", "↑ with keyCode 229 (IME) is ignored");

// ── modifiers are ignored ──
press("ArrowUp", { ctrlKey: true });
ok(draft() === "", "Ctrl+↑ is ignored");
press("ArrowUp", { metaKey: true });
ok(draft() === "", "Meta+↑ is ignored");

// ── focus outside the composer is ignored ──
window.document.body.focus();
act(() => window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: false, cancelable: true })));
ok(draft() === "", "↑ while the composer is not focused is ignored");

// ── history normalization ──
setNodes([
  { kind: "user", content: [{ type: "text", text: "dup" }] },
  { kind: "user", content: [{ type: "text", text: "dup" }] },
  { kind: "user", content: [{ type: "text", text: "" }] },
  { kind: "user", content: [{ type: "image", image: "x" }] },
  { kind: "user", content: [{ type: "text", text: "after" }] },
]);
press("ArrowUp");
ok(draft() === "after", "↑ with deduped history recalls the latest unique message");
press("ArrowUp");
ok(draft() === "dup", "consecutive duplicates fold into one entry");

// ── draft divergence exits browsing ──
press("ArrowDown"); // from "dup" to "after"
press("ArrowDown"); // past newest → empty
press("ArrowUp"); // now at "after", browsing
ok(draft() === "after", "editing state: inspecting a recalled entry");
setInput({ draft: "after edited" }); // user edits
press("ArrowDown"); // browsing should have exited; nothing happens
ok(draft() === "after edited", "edit exits browsing; ↓ does not erase the edit");

root.unmount();
const summary = `${checks - failures}/${checks} checks passed`;
console.log(failures === 0 ? `✓ ${summary}` : `✗ ${summary}`);
process.exit(failures === 0 ? 0 : 1);

# 09. FRACTAL SANDBOX PROTOCOL (Micro-App Architecture)

> **Concept:** "Cells must talk to the Organism."

## 1. THE ISOLATION PROBLEM
Running code in an `iframe` is safe but useless if it's deaf and dumb.
We need a **Bi-directional Bridge** between the Micro-App (Cell) and ZIA OS (Organism).

## 2. ZIA CLIENT SDK (Injected Automatically)
Every `req_render_app` HTML output is automatically wrapped with this JS preamble:

```javascript
window.ZIA = {
  // Send data back to ZIA's memory
  save: (key, value) => {
    window.parent.postMessage({ type: 'ZIA_SAVE', key, value }, '*');
  },
  // Request Swarm Compute
  compute: (code) => {
    window.parent.postMessage({ type: 'ZIA_COMPUTE', code }, '*');
  },
  // Trigger a User Message
  say: (text) => {
    window.parent.postMessage({ type: 'ZIA_SAY', text }, '*');
  }
};
```

## 3. THE HANDSHAKE (OS Side)
The `ArtifactCanvas` component listens for `message` events:
1.  **Verify Origin:** Ensure message comes from the specific iframe.
2.  **Route Intent:**
    - `ZIA_SAVE` -> `orchestrator.store(...)`
    - `ZIA_COMPUTE` -> `driveBridge.saveFile(...)`
    - `ZIA_SAY` -> `handleSendMessage(...)`

## 4. RECURSIVE GENERATION
A Micro-App can request the creation of *another* Micro-App by sending a specific intent to the OS, enabling **Fractal Expansion**.

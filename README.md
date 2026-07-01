# IMAGINAITE — Website Motion & Interaction Code

Custom Three.js/WebGL front-end code for the Imaginaite marketing-agency website: an interactive particle-text logo and a draggable, mouse-reactive reflective "social cube."

## What it does

This repo holds the hand-written interactive graphics that give the Imaginaite site its identity. It is **embeddable front-end code** (script snippets + assets) rather than a full standalone web app — the pieces are designed to be dropped into the site's pages.

- **Particle logo animation** (`shaders.js`) — renders the word `IMAGINAITE` as ~1,500 GPU particles using a custom GLSL vertex/fragment shader pair. Particles scatter and reflow around the cursor (with a stronger "push" on mouse-down), driven by a Three.js `FontLoader` mesh sampled into points. The displayed word is configurable via a small query-string form in `scripts.js`.
- **Interactive social cube** (`mirrorcube.js`) — a reflective cube inside a cube-mapped skybox that the user can spin with a virtual trackball (mouse or touch), with inertia/drag decay. A second textured cube uses raycasting so each face is a clickable social link, and the camera drifts subtly toward the pointer for a parallax feel.
- **Scene glue** (`scripts.js`) — sets up the Three.js `LoadingManager`, camera, transparent WebGL renderer, and animation loop, and boots the particle scene once fonts/textures load.

## Tech stack

- **JavaScript (ES6 classes)**, no framework
- **Three.js r125** (loaded from CDN) — WebGL rendering, shaders, raycasting, cube textures
- **Custom GLSL** vertex + fragment shaders (points/particles)
- **jQuery** (used only for the small text-input form)
- Assets: `background.jpg`; fonts/particle sprites loaded from Cloudinary, skybox from Imgur

## Setup / run

There is no build step or `package.json` — these are drop-in embed snippets that expect Three.js on the page and specific host elements.

To preview locally:

1. Create an `index.html` that includes Three.js r125 and the container elements the scripts target:
   - `#magic` (particle logo) and `#mirrorcube` (reflective cube).
2. Include the scripts, e.g.:
   ```html
   <div id="magic"></div>
   <div id="mirrorcube"></div>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r125/three.min.js"></script>
   <!-- shaders.js and scripts.js already contain their own <script> wrappers -->
   ```
3. Serve the folder over a local static server (e.g. `python -m http.server`) so the CDN/cross-origin textures load correctly, then open it in a browser.

> Note: `shaders.js` and `scripts.js` are stored with their `<script>`/`<script type="x-shader/...">` tags inline, which is how they were pasted into the site's page builder. To reuse them as normal modules, strip the outer tags.

## Context

Imaginaite is the AI-focused marketing agency Sina co-founded and served as CTO of (2023–2025). This repository contains the bespoke interactive/motion code from the agency's public website — a portfolio artifact showing creative WebGL and shader work rather than a full application.

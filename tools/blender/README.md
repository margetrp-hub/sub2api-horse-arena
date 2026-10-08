# Export the current workstation to Blender

From the repository root, run:

```powershell
node tools/blender/export-workstation.mjs
```

An optional first argument changes the output directory. The tool uses the existing Three.js scene and a temporary localhost Vite server, then closes its own Chrome and server. It requires local Chrome and the existing workspace `playwright` package; it does not open or modify an in-app browser. These tool files are excluded from Vite's explicit production entry list.

Default output: `output/blender/haolema-20261008/workstation-source.glb`, with camera/bounds/source hashes in `workstation-source.json` and a browser reference image. The binary embeds the existing MOBA image and all canvas sign textures. A GLTFLoader round-trip and binary JSON checks verify the exported screen texture, boss, camera, and embedded images.

Import the GLB through Blender's glTF importer. Named anchors include `Room`, `Workstation`, `Horse`, `Boss`, `Door`, `Pendant`, `Desk`, `CRT_Monitor`, `CRT_Game_Screen`, and `ReferenceCamera`; the game material is `CRT_Game_Display`. Three's asymmetric orthographic frustum is converted to an equivalent centered camera for glTF. Blender's importer handles the Y-up to Z-up conversion. Static geometry remains in the source's material batches under `Room`. Contact-shadow cards and runtime lights are omitted so Blender can provide real lighting; their source light values and removed-card count are recorded in JSON.

# Main Arena Design QA

- Source visual truth: `D:\wiki\output\sub2api-horse-arena\assets\api-game-kit-v2\final\oh-haolema-master-fixed-top-row.png`
- Production implementation: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-production.png`
- Desktop implementation: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-desktop.png`
- Compact implementation: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-compact.png`
- Mobile implementation: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-mobile.png`
- Full-view comparison evidence: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-comparison.png`
- Focused screen comparison evidence: `D:\wiki\output\sub2api-horse-arena\output\playwright\game-real-screens-comparison-focus.png`
- Viewports: desktop `1600x900`, compact desktop `1366x768`, and portrait mobile `390x844`
- State: production build, live top-ten simulation active, all ten CRT screens animated, station modal and cow-boss interactions checked

## Findings

No actionable P0, P1, or P2 findings remain.

- Fonts and typography: game branding, station plates, statistics, ranking entries, and modal content remain legible without overlap. Long account names truncate intentionally in the narrow ranking panel.
- Spacing and layout rhythm: the room contains exactly two rows of five stations. The ranking is outside the 4:3 scene, horses stay behind the CRT glass layer, and browser measurements show no scene/panel intersection at any tested viewport.
- Colors and visual tokens: aged beige CRTs, dark wood, blue chairs, green-brown walls, deep blue floor tiles, gold ranking accents, cyan highlights, and green live states remain aligned with the approved master.
- Image quality and asset fidelity: the room, workstations, three horse states, cow boss, and ten realistic screen contents are Image API raster assets. Each `640x480` WebP screen is perspective-warped into the measured CRT glass quad and retains animated Canvas details and scanlines.
- Copy and content: the product is named `OH！薅乐马`; the right panel shows the live top ten, and station/ranking selection opens that user's token detail view.

## Functional Evidence

- All 16 production assets loaded from `dist` with no console errors, page errors, or HTTP responses at or above 400.
- A 900ms production Canvas comparison changed `1,710,359` pixels. The first CRT independently changed `5,840` pixels inside its `73x80` measured screen region.
- Hovering a station displays its contained tooltip; clicking opens the correct user modal; closing restores the scene.
- Clicking the cow boss increments the spur interaction and triggers the all-user burst state.
- Desktop, compact desktop, and mobile runs have no document overflow and no scene/ranking overlap.
- `npm run build` passes and emits `dist/game.html` plus the complete screen and character asset sets.

## Patches Made Since Previous QA

- Replaced the ten geometric screen placeholders with generated dashboard, API console, MOBA, shooter, video, download, leaderboard, solitaire, AFK, and fishing screen art.
- Added per-screen animated overlays while preserving exact CRT perspective clipping and horse foreground ordering.
- Added lossless WebP outputs, reducing the ten runtime screen assets to about `1.27 MB` total.
- Corrected runtime asset bases from development-only `public/assets/...` paths to production-safe `assets/...` paths.
- Captured fresh desktop, compact, mobile, interaction, full-comparison, and focused-screen evidence.

## Follow-up Polish

- P3: a future Image API batch can add more clothing, hat, and coat-color variants without changing the scene architecture.
- P3: live token data still needs the production API response schema; current player values remain simulated.

final result: passed

## Activity Center Current Baseline

- Current visual direction: pixel arcade / mosaic style with a large lottery machine stage and a compact activity rail.
- Current animation implementation: Pixi runtime canvas in `src/lottery-machine-runtime.ts`; the old generated WebM path is no longer used by the page.
- Current motion duration: approximately 6.2 seconds, covering press, machine agitation, capsule drop, tray settle, opening, and reward hold before the result modal.
- Current responsive layout: the machine is the primary visual column; the activity rail is constrained to a narrower width and stacks below it on mobile.
- Current verification: desktop and mobile screenshots checked after the pixel and layout passes; `npm run build` passes; lottery API regression suite passes 19/19.

The earlier visual evidence sections in this file are retained as history. The runtime and layout statements above are authoritative for the current activity-center build.

## Lucky Capsule Physical Feedback Pass

- Verification idle: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-press-idle-v3.png`
- Verification rolling: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-physical-rolling.png`
- Verification dropped: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-physical-dropped.png`
- Verification mobile rolling: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-physical-mobile-rolling-v2.png`
- Viewports: desktop `1536x1024`; mobile `390x844`

## Findings

No actionable P0, P1, or P2 findings remain.

- The machine artwork remains visual only; press feedback is rendered by a real HTML button with a metal bezel, depressed state, and disabled state.
- Rolling feedback is layered as independent CSS motion: machine shake, moving ball swarm, outlet flash, and a separate capsule trajectory.
- The primary rolling presentation is now a single generated `lottery-spin.webm` asset; CSS remains the fallback for browsers that cannot decode WebM.
- The dropped capsule settles into a dedicated output tray before the result can be opened. The result card remains the explicit reveal step.
- Browser evaluation confirms `scrollWidth === viewport` at both tested sizes and no horizontal overflow.

## Functional Evidence

- Desktop click path: `idle -> rolling -> dropped -> revealed`.
- Rolling computed styles include `machineShake` and `swarmTilt`; the capsule element is visible while the output tray is active.
- The dropped capsule bounding box is inside the machine stage tray region; opening the capsule renders the generated open-capsule asset and prize text.
- Mobile click path keeps the button and output tray separated (`button.right < output.left`) and preserves `scrollWidth 390`.
- `navigator.vibrate` is called when supported for a short tactile pulse on physical devices.

## Patches Made Since Previous Pass

- Replaced the transparent click hot-zone with a visible press button and metal control bezel.
- Added CSS ball-swarm motion, outlet glow, output window, tray, capsule drop, and capsule settle animations.
- Generated and wired `public/assets/lottery-spin.webm`; the prize stays hidden until the video's `ended` event.
- Changed user-facing action copy from pulling a lever to pressing a button.
- Added a mobile-only control offset so the button and output tray do not overlap.

final result: passed

## Lucky Capsule Page Design QA

- Source visual truth: `D:\wiki\lab\repos\sub2api-horse-arena\output\imagegen\lottery-page-concept-v1.png`
- Implementation idle screenshot: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-page-final2-idle.png`
- Implementation rolling screenshot: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-page-final2-rolling.png`
- Implementation revealed screenshot: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-page-final2-revealed.png`
- Full-view comparison: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-design-qa-comparison-final.png`
- Focused right-rail comparison: `D:\wiki\lab\repos\sub2api-horse-arena\output\playwright\lottery-design-qa-focus-final.png`
- Viewports: desktop `1536x1024`; mobile `390x844`
- State: idle, rolling, dropped, and revealed preview states; no real account or payment mutation

## Findings

No actionable P0, P1, or P2 findings remain.

- Fonts and typography: the reference hierarchy is preserved with a large split-color title, compact mono labels, and high-contrast metric values. Responsive text stays within its cards.
- Spacing and layout rhythm: desktop uses a left hero stage and right information rail; mobile stacks the hero above the rail. Browser measurements report no horizontal overflow (`scrollWidth 390` at a `390px` viewport).
- Colors and visual tokens: the generated warm arcade background is dimmed behind charcoal content, while warm ivory cards, coral actions, cyan counters, and brass accents match the reference direction.
- Image quality and asset fidelity: the page uses separate raster assets for the machine, closed capsule, opened capsule, and ambient background. The open-capsule asset was cleaned to remove the generated checkerboard background before use.
- Copy and content: the earning rule consistently says `消费` and `实际支付金额`; `充值加赠 5%` remains only as the name of its prize type.

## Functional Evidence

- Clicking the machine trigger sets the page to `rolling`, applies the visible `machineShake` animation, and shows a separate capsule asset with `capsuleDrop` animation.
- After the drop, the page enters `dropped`, disables draw actions, and exposes `点击开盒`.
- Clicking `点击开盒` enters `revealed`, hides the closed capsule, shows the generated opened-capsule image, and renders the selected prize.
- The local preview decrements one available draw and leaves the real Sub2API account untouched.
- `npm run build` passes and emits `dist/lottery.html`; API regression tests remain 16/16 passing.

## Patches Made Since Previous QA Pass

- Added the standalone `lottery.html` route and `src/lottery-main.ts` page controller.
- Replaced the modal-first presentation with a full-screen independent lottery page.
- Added generated raster assets: `lottery-machine-hero-v1.png`, `lottery-capsule-closed-v1.png`, `lottery-capsule-open-v1.png`, and `lottery-ambient-bg-v2.png`.
- Added visible machine shake, capsule drop, dropped state, open-box transition, and result-card animation.
- Corrected all progress copy from recharge to consumption and made asset paths follow `import.meta.env.BASE_URL` for `/game/` deployment.

## Follow-up Polish

- P3: replace preview state with the activity service contract for server-authoritative draw results, idempotent rewards, and persisted progress.
- P3: add real prize icons or generated reward slips if the final operations team wants richer prize differentiation.

final result: passed

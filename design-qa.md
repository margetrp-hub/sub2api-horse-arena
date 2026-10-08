# Main Arena Design QA

## Miniature 3D Workstation: 2026-10-08

Status: **LOCAL CANDIDATE**. The user approved a playable single-workstation sample
after discussing a fixed-camera miniature netcafe. This is an independent
`diorama.html` entry, not a production replacement of the pixel game.

- Warm cream / forest-green room, tiled miniature base, CRT workstation, toy horse
  and cow supervisor. Both characters have articulated procedural models; typing,
  slacking, startled recovery and stretching use the existing round state.
- User correction: the CRT shows a game match in every character state. It reuses
  `assets/screen-real-v4/moba.webp` in its native 4:3 aspect ratio, preserving the
  map, heroes and skill HUD. This is a static game image; the terminal and snake
  placeholders have been removed. Start waits for the screen texture to load.
- Preview controls show work, slacking and a timed supervisor visit. A real
  one-minute challenge reuses `src/practice/rules.ts`; pointer hold, Space and
  toggle controls, banking, inspection and the receipt remain local practice.
- Initial full-room framing made the character too small. The reviewed version
  uses a compact room, an enlarged workstation and a front-quarter camera that
  reveals the horse's face while retaining the doorway. The phone uses the near
  hand so the body does not hide it.
- Desktop layout and the mobile round layout keep the scene, warning, ledger and
  input available. Sound is opt-in. Reduced motion preserves semantic poses,
  skips decorative motion and redraws static poses only on state/size changes.
  The visual loop is capped at 30 fps; rules still integrate real elapsed time.
- Scene and entry load separately, static meshes batch by material, small details
  avoid unnecessary shadows, DPR is capped at 1.5, and hidden pages stop rendering.
  WebGL initialization failure offers a link to the pixel entry.
- Source rules: 9/9 tests passed. Browser evidence includes an actual 60-second
  round plus countdown, banking, a catch and receipt; final build checks cover
  toggle/keyboard/pointer input, native blur cancellation, frozen aborted scores,
  reduced motion and 320/390px layouts. No account/economy requests are made.

Evidence and exact build/check boundaries:
[`browser-qa-summary.md`](../../ops/haolema-diorama-20261008/browser-qa-summary.md),
[`initial real round`](../../ops/haolema-diorama-20261008/browser-qa-report-initial.json),
[`build regression`](../../ops/haolema-diorama-20261008/browser-qa-report-final.json).
Screenshots: `output/playwright/diorama-20261008/`.
Screen correction: production build passed; browser checks confirmed the texture
loads successfully and remains visible during work, slacking and the supervisor
visit, with no normal load errors. Missing texture uses the existing
unavailable-state fallback. Evidence: `screen-content-work-crt.png`,
`screen-content-slack-crt.png`, `screen-content-boss-workstation.png` and
`screen-content-resource-fallback.png` in the screenshot directory above.

Physical-phone GPU performance, long-session memory behavior and user acceptance
of the new art direction remain **UNVERIFIED**. There is no deployment, account
progression, reward integration or replacement of existing production entries.

## Three-Dimensional Lottery: 2026-09-07

Status: **LOCAL-VERIFIED**, prepared for the already authorized frontend release.

- Replaced the pixel machine with a procedural Three.js model: coral enamel,
  glass chamber, chrome crank, coin slot, tray and 36 two-piece capsules.
  cannon-es owns capsule collisions and containment during agitation.
- Mouse drag, horizontal touch, keyboard arrows and reset control change the view.
  The crank and demo control only animate the toy; they never submit economy writes.
  Server-authorized draws retain the existing result and idempotency contracts.
- The WebGL canvas survives account rerenders. Reduced motion disables inertia
  and extended sequences; hidden views stop rendering. WebGL failure uses the
  existing bitmap, with unavailable 3D controls disabled.
- The existing 32 browser checks passed. A further 37 rendering and interaction
  checks passed at desktop, wide desktop, mobile and 320px widths; two additional
  touch checks verified horizontal rotation and vertical page scrolling.
  The reduced-motion image difference was zero, colored machine pixels were
  nonblank and the body/cap stayed between 6% and 92% of canvas height.
- TypeScript/Vite build, 23 API tests and 9 practice tests passed. The new 3D
  entry is about 173 KB gzipped. Physical-phone GPU performance remains unverified;
  browser screenshots used Chrome with SwiftShader.

Evidence: `output/playwright/lottery-3d-20260907/`,
`output/playwright/lottery-design-20260907/report.json`.

## Lottery Redesign: 2026-09-07

Status: **LOCAL-VERIFIED**, included in the authorized UI release candidate.
The machine now stands on an unframed stage, with sharper pixel rendering and
the same charcoal/lime/coral palette as the workstation. Token and account-point
balances share one row, followed by draw actions, exchange and the prize section.
The compact mobile stage makes the main actions accessible earlier in the page.

- Loading and unavailable balances show `--`; login, service failure, retry and
  server-confirmed closure are distinct. Preview content remains server-authorized.
- Result dialogs isolate the background, trap keyboard focus and restore the
  originating action. Reduced motion skips the extended machine animation.
- 32 browser checks passed across 1440x900, 1280x720, 820x1180, 390x844,
  320x568 and 844x390. Full screenshots were inspected; no horizontal clipping,
  JS errors, duplicate submissions during animation or preview disclosure occurred.
- Draw and exchange tests used browser-local API fixtures. They do not represent
  real account deductions or prize delivery; live reward opening is unchanged.

Evidence: `output/playwright/lottery-design-20260907/report.json`, desktop/mobile,
preview, result and mobile-result screenshots in the same directory.

## Current Local UI: 2026-09-07

Status: **LOCAL-VERIFIED**. This section covers the personal workstation, practice
round and main-entry office sidebar. Historical production and lottery sections
below describe their own earlier versions; this pass was not deployed.

- Retained the existing layered bitmap room, horse, CRT and boss assets. Replaced
  the dense bordered interface with an unframed scene, charcoal surfaces, lime
  actions, mint banked-score feedback and amber/coral inspection states.
- Lobby prioritizes the workstation and one-minute challenge. The score ledger
  appears during a round. Lucide icons, input segments, opt-in sound, a paper
  receipt and responsive character framing share one implementation in both entries.
- The main entry has a right-hand TOP 10 with keyboard-operable selection, retry,
  source/empty/error/stale states, and full ranking access on mobile. Selecting a
  ranking row opens the public office. Local check-in points are labeled as local.
- Inspected full screenshots at 1440x900, 1280x720, 820x1180, 390x844, 320x568,
  844x390 and 1920x1080. Corrected a populated-board grid overflow, mobile title
  overlap with the bitmap sign and the small-screen nameplate covering the character.
- `npm run test:practice`: 9/9; `npm run test:api`: 23/23; TypeScript/Vite build
  and `git diff --check` passed. The existing legacy `runtime-config.js` bundling
  warning remains; both built entries load their runtime assets successfully.
- Browser QA: 38 checks plus 15 final built-path checks passed. A real-time full
  round banked 25 points, incurred one catch, and produced a valid receipt. Mobile
  toggle, keyboard ranking, retry, stale data retention, focus handling, background
  restoration and both `/game/` and `/game/game.html` were exercised.
- Desktop canvas had 40,739 sampled colors and 24,208 changed samples; mobile had
  17,494 colors and 4,920 changed samples. Reduced-motion canvas captures matched.
  No JS exceptions or missing visual assets were reported. Rendering automation
  used local Chrome with SwiftShader; this is not a physical-phone GPU benchmark.

Evidence: [`report.json`](./output/playwright/ui-design-20260907/report.json),
[`final-smoke.json`](./output/playwright/ui-design-20260907/final-smoke.json),
[`desktop`](./output/playwright/ui-design-20260907/final-desktop.png),
[`mobile`](./output/playwright/ui-design-20260907/final-mobile.png),
[`small screen`](./output/playwright/ui-design-20260907/final-small.png), and
[`receipt`](./output/playwright/ui-design-20260907/desktop-result.png).

Ranking fixtures use `example.com` and are local test data. Final preview captures
deliberately use an unavailable API state. Live authentication/ranking, account
progression/rewards, deployment, physical-device behavior and user design approval
remain **UNVERIFIED**. The dev preview is `http://127.0.0.1:5173/`.

## Historical Arena Baseline

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

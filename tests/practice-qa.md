# Phase A QA Inventory

Scope: local practice only. No account rewards, server persistence, production deployment,
or real authenticated production verification. Mock ranking fixtures must be identified
as fixtures, not live user evidence.

2026-09-07 update: the UI and responsive scene were refined, and screenshots can now
be inspected. Current visual evidence and the 38-check browser pass plus 15 final
built-path checks are recorded in [design-qa.md](../design-qa.md#current-local-ui-2026-09-07).
The image-tool limitation below belongs to the earlier 2026-09-06 run. Physical-device,
user gameplay acceptance and production checks remain unverified.

| Claim / control | Functional check | State and evidence |
| --- | --- | --- |
| Personal workstation independent of TOP 10 | Guest, empty/failed rankings, current user rank 27 | Lobby, desktop and mobile captures |
| Existing entrances use the same game | index.html and game.html open, close, reopen | No duplicate controllers or canvases |
| Prepare then play | Start via button, three seconds, controls disabled until playing | Countdown, 60-second timer |
| Hold and release | Mouse, Space, touch press/release | Gaming and working sprites/screens change |
| Accessible toggle | Switch input in lobby, click twice during round | Pressed state on/off; same bank delay |
| Banking / multiplier | 3/6-second boundaries, interrupted banking, full 1 second | Pending, secured score, progress, floating feedback |
| Inspections | At least 1.5-second warning, enter during visit, get caught once | Warning bar, boss bitmap, catch notice, recovery |
| Deadline | Final five seconds, valid finish and idle finish | Result score, discarded pending, best and valid count |
| Result controls | Retry, home, office and return | Fresh round; session best retained; reload clears it |
| Abandonment | Exit, Escape, window blur, hidden tab | Explicit aborted result; no valid completion |
| Input cancellation | Pointer cancel, lost capture, multiple pointers, repeated Space | No stuck slacking or scoring during recovery |
| Rank refresh isolation | Poll while a round is active, then upstream error | Timer/score uninterrupted, source status honest |
| Assets unavailable | Abort manifest request, retry after unblocking | Visible failure and working retry |
| Sound / reduced motion | Sound checkbox full cycle; reduced-motion emulation | No audio before opt-in; warning remains visible |
| Layout and real pixels | 1440x900, 390x844, 360x800, 844x390 | Bounds, hit targets, overflow, nonblank and moving canvas |
| Focus | Tab cycle, result focus, restored launcher focus | No background actions reachable during full-screen play |
| Regression boundary | Existing API tests, TypeScript build, /game/ build paths | No real reward / backend files changed |

Exploratory pass: rapid alternating inputs, release outside the button, starting while
Space is held, an interrupted banking attempt, an inspection catch followed by retry,
and returning to the public office with unavailable rankings.

Screenshots and run-specific evidence live in `artifacts/phase-a-*`. Capturing an image
or passing geometry checks does not by itself constitute a visual design signoff.

## Local Run: 2026-09-06 (Asia/Shanghai)

Status: local implementation and functional verification complete; human gameplay,
visual design and real-device acceptance pending. Base commit:
`54fdff8ba2079820523d414dfdb6ec1c42a9dd41`, with uncommitted Phase A changes.
No production service or account data was changed.

### Automated Checks

- `npm run test:practice`: 9/9 passed. Covers deterministic timing, multiplier
  boundaries, banking, catches/recovery, warnings, deadline and valid completion.
- `npm run test:api`: 20/20 passed.
- `npm run build`: passed, including TypeScript checking and all four HTML entries.
- `git diff --check`: passed. Existing LF/CRLF notices are not whitespace failures.
- Existing Vite warning about the classic `runtime-config.js` script in `game.html`
  remains; the runtime config is copied, not bundled as a module.

### Browser Functional Evidence

Chromium via Playwright, with local ranking fixtures or deliberately unavailable API
responses. A fixture `current_user` at rank 27 and an empty TOP 10 both retained the
personal workstation. These are not real authenticated account checks.

- Desktop: a real-time 60-second round banked 35 points, deliberately incurred one
  catch, and finished validly with a session best of 35. A later real-time desktop
  capture finished with 11 points. Mobile toggle mode completed a real-time round
  with 16 banked points and a valid result.
- Mouse press/release, release outside the button, Space hold/release and repeat,
  preparation input rejection, toggle on/off, and CDP touch press/release/cancel
  were exercised. Banking, warning, caught and recovery states were reached.
- Explicit exit and Escape produced aborted results. Retry, home, public office,
  launcher reopen, session-only best and reload reset were checked.
- Result focus moved to the heading; Tab reached retry and Shift+Tab wrapped to
  home. Closing the mobile overlay restored background interaction: zero remaining
  `[inert]` elements.
- Ranking polling was observed through browser resource entries. A 503 during play
  preserved the round timer and 10 banked points while showing the failed update.
- Aborting the asset manifest request showed the asset failure state; retry after
  unblocking recovered with exactly one personal canvas.
- Sound opt-in was toggled on and off. Reduced-motion lobby canvas captures were
  identical 350 ms apart; audible quality was not evaluated.
- Synthetic `blur` and `visibilitychange` events produced the expected aborted
  reasons. This verifies handlers, not actual OS background or lock-screen behavior.
- An idle round advanced with the Playwright clock did not count as completed.
  Twenty restart/abort cycles using the clock retained 201 DOM nodes, two total
  canvases, one personal canvas and zero JS errors. This is a bounded lifecycle
  check, not 20 real completed rounds or a heap/GPU leak proof.
- Legacy `game.html` passed rank-27, empty-ranking and delayed-module (2500 ms)
  identity checks, Space banking, abort/home/office/reopen, with zero JS errors.

### Viewport and Rendering Evidence

Required region bounds were checked at 1440x900, 390x844, 360x800 and 844x390.
Measured states had no page-level horizontal overflow, and primary controls,
including sound and input-mode controls, had at least 48 CSS px hit targets.
The mobile result receipt measured 350x547; the landscape receipt measured 680x265.

Desktop canvas: 1010x526, 10,981 sampled colors, 4,596 changed pixels between frames.
Landscape canvas: 564x288, 289 sampled colors, 2,994 changed pixels between frames.
These show nonblank, changing rendering; they do not establish aesthetic quality.

Screenshots: `phase-a-lobby-desktop.png`, `phase-a-bank-desktop.png`,
`phase-a-warning-desktop.png`, `phase-a-caught-desktop.png`,
`phase-a-result-desktop.png`, `phase-a-lobby-mobile.png`,
`phase-a-lobby-mobile-360.png`, `phase-a-playing-mobile-360.png`,
`phase-a-playing-landscape.png`, `phase-a-result-landscape.png`,
`phase-a-result-mobile.png`, all under `artifacts/`.

### Built-Path Smoke

Vite preview served the existing build locally with `--base /game/`.
Both `/game/` and `/game/game.html` loaded the personal scene and started a challenge.
The main entry banked 7 points via Space; abort/home/office restored zero inert peers.
The legacy entry completed abort/home/office/reopen with one personal canvas.
Across both entries: zero JS exceptions and zero non-API HTTP asset errors.
Ranking was deliberately returned as 503, not connected to a live adapter.
The temporary preview server was stopped after this check.

### Explicitly Unverified

- Screenshot visual/aesthetic signoff: image tools returned that the current model
  could not inspect image input. Captures and numeric checks were retained for review.
- Physical phone touch behavior, actual background/lock-screen transitions,
  Safari/iOS, audible sound quality, long-session heap/GPU use and weak-device performance.
- First-time usability, voluntary replay, difficulty balance or retention improvement.
- Production entry/version, live authentication/ranking, account persistence,
  cross-device progression, collections, real rewards and deployment/rollback.

Do not mark the overall upgrade plan or its gameplay acceptance gate complete based
only on this local functional run.

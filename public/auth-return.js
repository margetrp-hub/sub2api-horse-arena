/* Loaded by the host login shell; no effect without an explicit game login. */
(() => {
  const key = "oh-haolema:login-return";
  const source = document.currentScript?.dataset.source;
  if (source !== "newapi" && source !== "sub2api") return;
  const paths = new Set(["/game/", "/game/index.html", "/game/game.html", "/game/lottery.html", "/game/station.html"]);
  const landings = new Set(["/dashboard", "/admin/dashboard"]);
  let pending;
  try { pending = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { /* URL fallback below. */ }
  if (!pending && ["/sign-in", "/login"].includes(window.location.pathname)) {
    const target = new URLSearchParams(window.location.search).get("redirect");
    if (paths.has(target)) pending = { path: target, createdAt: Date.now() };
  }
  if (!pending || !paths.has(pending.path) || !Number.isFinite(pending.createdAt) || pending.createdAt > Date.now() || Date.now() - pending.createdAt > 15 * 60_000) {
    try { sessionStorage.removeItem(key); } catch { /* Storage can be disabled. */ }
    return;
  }
  let busy = false;
  let stopped = false;
  let timer;
  let attempts = 0;
  let lastAttempt = 0;
  const stop = () => { stopped = true; clearInterval(timer); };
  const finish = () => {
    if (stopped) return;
    stop();
    try { sessionStorage.removeItem(key); } catch { /* Navigation does not require storage. */ }
    window.location.replace(pending.path);
  };
  const validUser = (user) => Number.isSafeInteger(user?.id) && user.id > 0;
  async function authenticated() {
    if (source === "sub2api") {
      let token;
      try { token = localStorage.getItem("auth_token"); } catch { return false; }
      if (!token) return false;
      const response = await fetch("/api/v1/auth/me", {
        credentials: "include", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json", Authorization: /^Bearer\s+/i.test(token) ? token : `Bearer ${token}` },
      });
      const body = await response.json();
      return response.ok && body.code === 0 && validUser(body.data);
    }
    const refresh = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch("/api/user/auth/refresh", {
          method: "POST", credentials: "include", cache: "no-store", redirect: "error",
          signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" },
        });
        const body = await response.json();
        if (response.status === 409 && body.code === "AUTH_REFRESH_RACE" && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, [100, 300][attempt]));
          continue;
        }
        return response.ok && body.success === true && validUser(body.data?.user);
      }
      return false;
    };
    return navigator.locks ? navigator.locks.request("new-api:auth-refresh", { mode: "exclusive" }, refresh) : refresh();
  }
  async function check() {
    if (stopped || busy || document.visibilityState === "hidden") return;
    if (Date.now() - pending.createdAt > 15 * 60_000) { stop(); return; }
    const pathname = window.location.pathname;
    // Some host routers remove the trailing slash from the game home route.
    if (pathname === pending.path || (pathname === "/game" && pending.path === "/game/")) { finish(); return; }
    // Covers 2FA/provider flows which fall back to the dashboard. Verify the
    // host session before returning; a failed login never counts as success.
    if (!landings.has(pathname) || Date.now() - lastAttempt < 5000 || attempts >= 4) return;
    attempts++;
    lastAttempt = Date.now();
    busy = true;
    try {
      if (await authenticated() && window.location.pathname === pathname) finish();
    } catch { /* Leave the main application's own retry/error UI in control. */ }
    finally { busy = false; }
  }
  timer = setInterval(check, 1200);
  window.navigation?.addEventListener("navigatesuccess", check);
  window.addEventListener("pagehide", stop, { once: true });
  void check();
})();

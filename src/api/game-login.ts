const pendingKey = "oh-haolema:login-return";

export function gameReturnPath(): string {
  const base = import.meta.env.BASE_URL;
  const pages = [base, `${base}index.html`, `${base}game.html`, `${base}lottery.html`, `${base}station.html`];
  return pages.includes(window.location.pathname) ? window.location.pathname : base;
}

export function gameLoginHref(): string {
  const login = window.OH_HAOLEMA_RUNTIME?.source === "sub2api" ? "/login" : "/sign-in";
  return `${login}?${new URLSearchParams({ redirect: gameReturnPath() })}`;
}

export function rememberGameLogin(): void {
  try {
    sessionStorage.setItem(pendingKey, JSON.stringify({ path: gameReturnPath(), createdAt: Date.now() }));
  } catch { /* The login URL still carries the return path when storage is unavailable. */ }
}

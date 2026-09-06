import { PersonalWorkstation } from "./PersonalWorkstation";

const frame = document.querySelector<HTMLElement>("#frame");
if (frame) {
  const workstation = new PersonalWorkstation(frame, {
    onVisibilityChange: (visible) => {
      frame.dataset.practiceVisible = String(visible);
    },
  });
  const setIdentity = (user: { name?: unknown; rank?: unknown } | null): void => {
    const rank = Number(user?.rank);
    workstation.setIdentity(user ? {
      name: String(user.name || "我的工位"),
      rank: Number.isFinite(rank) && rank > 0 ? Math.trunc(rank) : null,
    } : null);
  };
  // Reuse the legacy request, including a response received before this module loaded.
  window.addEventListener("haolema:ranking-current-user", (event) => {
    setIdentity((event as CustomEvent<{ name?: unknown; rank?: unknown } | null>).detail);
  });
  if (frame.dataset.practiceIdentity) {
    try { setIdentity(JSON.parse(frame.dataset.practiceIdentity)); } catch { setIdentity(null); }
  }
}

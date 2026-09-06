export const RULES_VERSION = "slack-practice-v1";
export const PREPARE_MS = 3_000;
export const ROUND_MS = 60_000;
export const BANK_MS = 1_000;
export const RECOVERY_MS = 2_000;

export type Inspection = { warning: number; start: number; end: number };
export type RoundPhase = "countdown" | "playing" | "finished" | "aborted";
export type BossState = "away" | "warning" | "inspecting";
export type RoundSnapshot = {
  phase: RoundPhase;
  remaining: number;
  countdown: number;
  slacking: boolean;
  multiplier: number;
  pending: number;
  banked: number;
  bankProgress: number;
  banks: number;
  largestBank: number;
  catches: number;
  lost: number;
  expired: number;
  slackMs: number;
  recovery: number;
  boss: BossState;
  warningRemaining: number;
  valid: boolean;
};

export function makeInspections(random = Math.random): Inspection[] {
  const count = 4 + Math.min(2, Math.floor(random() * 3));
  const spacing = 49_000 / count;
  return Array.from({ length: count }, (_, index) => {
    const warning = 5_000 + index * spacing + random() * 2_000;
    const start = warning + 1_500 + random() * 700;
    return { warning, start, end: start + 1_800 + random() * 1_400 };
  });
}

function earnings(ms: number): number {
  return Math.min(ms, 3_000) * 0.01
    + Math.max(0, Math.min(ms - 3_000, 3_000)) * 0.015
    + Math.max(0, ms - 6_000) * 0.02;
}

// Integrate exact rule boundaries, not frame deltas: a slow frame cannot skip a catch or bank.
export class SlackRound {
  readonly inspections: Inspection[];
  private readonly startsAt: number;
  private now: number;
  private phase: RoundPhase = "countdown";
  private slacking = false;
  private streak = 0;
  private workSince: number;
  private recoveryUntil = 0;
  private pending = 0;
  private banked = 0;
  private banks = 0;
  private largestBank = 0;
  private catches = 0;
  private lost = 0;
  private expired = 0;
  private slackMs = 0;
  private caughtWindows = new Set<number>();

  constructor(now: number, inspections = makeInspections()) {
    this.now = now;
    this.startsAt = now + PREPARE_MS;
    this.workSince = this.startsAt;
    this.inspections = inspections.map((inspection) => ({ ...inspection }));
  }

  advance(now: number): RoundSnapshot {
    if (!Number.isFinite(now) || now < this.now) return this.snapshot();
    const target = Math.min(now, this.startsAt + ROUND_MS);
    while (this.now < target && !this.done()) {
      const boundaries = [
        target, this.startsAt, this.startsAt + ROUND_MS, this.recoveryUntil,
        ...this.inspections.flatMap(({ warning, start, end }) =>
          [warning, start, end].map((time) => this.startsAt + time)),
      ];
      if (!this.slacking && this.pending > 0) boundaries.push(this.workSince + BANK_MS);
      const next = Math.min(...boundaries.filter((time) => time > this.now));
      const delta = next - this.now;
      if (this.phase === "playing" && this.slacking) {
        this.pending += earnings(this.streak + delta) - earnings(this.streak);
        this.streak += delta;
        this.slackMs += delta;
      }
      this.now = next;
      this.resolveBoundary();
    }
    return this.snapshot();
  }

  setSlacking(slacking: boolean, now: number): RoundSnapshot {
    this.advance(now);
    if (this.phase !== "playing" || this.now < this.recoveryUntil) return this.snapshot();
    if (slacking !== this.slacking) {
      this.slacking = slacking;
      this.streak = 0;
      if (!slacking) this.workSince = this.now;
    }
    this.checkCaught();
    return this.snapshot();
  }

  abort(now: number): RoundSnapshot {
    this.advance(now);
    if (!this.done()) {
      this.phase = "aborted";
      this.slacking = false;
      this.expired = this.pending;
      this.pending = 0;
    }
    return this.snapshot();
  }

  snapshot(): RoundSnapshot {
    const elapsed = this.now - this.startsAt;
    const inspection = this.inspections.find(({ warning, end }) => elapsed >= warning && elapsed < end);
    return {
      phase: this.phase,
      remaining: Math.max(0, ROUND_MS - Math.max(0, elapsed)),
      countdown: Math.max(0, -elapsed),
      slacking: this.slacking,
      multiplier: this.streak < 3_000 ? 1 : this.streak < 6_000 ? 1.5 : 2,
      pending: this.pending,
      banked: this.banked,
      bankProgress: this.pending > 0 && !this.slacking
        ? Math.max(0, Math.min(1, (this.now - this.workSince) / BANK_MS)) : 0,
      banks: this.banks,
      largestBank: this.largestBank,
      catches: this.catches,
      lost: this.lost,
      expired: this.expired,
      slackMs: this.slackMs,
      recovery: Math.max(0, this.recoveryUntil - this.now),
      boss: !inspection ? "away" : elapsed < inspection.start ? "warning" : "inspecting",
      warningRemaining: inspection ? Math.max(0, inspection.start - elapsed) : 0,
      valid: this.phase === "finished" && this.slackMs > 0 && this.banks > 0,
    };
  }

  private done(): boolean {
    return this.phase === "finished" || this.phase === "aborted";
  }

  private resolveBoundary(): void {
    if (this.phase === "countdown" && this.now >= this.startsAt) this.phase = "playing";
    if (this.phase !== "playing") return;
    this.checkCaught();
    if (!this.slacking && this.pending > 0 && this.now >= this.workSince + BANK_MS) {
      this.banked += this.pending;
      this.largestBank = Math.max(this.largestBank, this.pending);
      this.banks += 1;
      this.pending = 0;
    }
    if (this.now >= this.startsAt + ROUND_MS) {
      this.phase = "finished";
      this.slacking = false;
      this.expired = this.pending;
      this.pending = 0;
    }
  }

  private checkCaught(): void {
    const elapsed = this.now - this.startsAt;
    const index = this.inspections.findIndex(({ start, end }) => elapsed >= start && elapsed < end);
    if (!this.slacking || index < 0 || this.caughtWindows.has(index)) return;
    this.caughtWindows.add(index);
    this.catches += 1;
    this.lost += this.pending;
    this.pending = 0;
    this.slacking = false;
    this.streak = 0;
    this.recoveryUntil = this.now + RECOVERY_MS;
    this.workSince = this.recoveryUntil;
  }
}

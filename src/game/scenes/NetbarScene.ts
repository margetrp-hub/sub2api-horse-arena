import { Container, IRenderer, SCALE_MODES, Sprite } from "pixi.js";
import type { Player } from "../../types";
import { stationSlots } from "../../data/stations";
import { WORLD } from "../constants";
import type { StationManifest } from "../stationManifest";
import { LayeredWorkstation } from "../entities/LayeredWorkstation";
import { GeneratedCowBoss } from "../entities/GeneratedCowBoss";
import { WorkerPhrasePopup } from "../entities/WorkerPhrasePopup";
import { AmbientEffects } from "../entities/AmbientEffects";
import { OfficeEventLayer, type OfficeEventType } from "../entities/OfficeEventLayer";
import { randomWorkerPhrase } from "../../data/workerPhrases";

type NetbarSceneOptions = {
  renderer: IRenderer;
  manifest: StationManifest;
  popupMount: HTMLElement;
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  onBossHit: (hits: number) => void;
};

export class NetbarScene extends Container {
  private readonly stations: LayeredWorkstation[] = [];
  private readonly backLayer = new Container();
  private readonly frontLayer = new Container();
  private readonly popups: WorkerPhrasePopup[] = [];
  private readonly previousPhrases = new Map<number, string>();
  private readonly ambient = new AmbientEffects();
  private readonly officeEvents = new OfficeEventLayer();
  private readonly boss?: GeneratedCowBoss;
  private chatterCursor = 0;
  private nextChatterAt = 0;
  private activeOfficeEvent: OfficeEventType | null = null;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  constructor(private readonly options: NetbarSceneOptions) {
    super();
    const background = Sprite.from(options.manifest.background);
    background.texture.baseTexture.scaleMode = SCALE_MODES.NEAREST;
    background.width = WORLD.width;
    background.height = WORLD.height;

    this.addChild(background, this.ambient);
    if (options.manifest.boss) {
      this.boss = new GeneratedCowBoss(options.manifest.boss, options.onBossHit, (text) => this.showPhrase(text, 850, 145));
      this.addChild(this.boss);
    }
    this.addChild(this.backLayer, this.frontLayer, this.officeEvents);
    this.createStations();
  }

  setPlayers(players: Player[]): void {
    this.options.players = players;
    this.popups.splice(0).forEach((popup) => popup.destroy());
    this.backLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.frontLayer.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.stations.length = 0;
    this.createStations();
    this.applyOfficeEvent(this.activeOfficeEvent);
    const selected = players.find((player) => player.self) ?? players[0];
    if (selected) this.selectRank(selected.rank);
  }

  selectRank(rank: number, emit = false): void {
    this.stations.forEach((station) => station.setSelected(station.player.rank === rank));
    const player = this.options.players.find((item) => item.rank === rank);
    if (player && emit) this.options.onPlayerSelect(player);
  }

  update(elapsedMs: number): void {
    const officeEvent = this.reducedMotion.matches ? null : this.officeEvents.update(elapsedMs);
    this.officeEvents.visible = Boolean(officeEvent);
    if (officeEvent !== this.activeOfficeEvent) {
      this.activeOfficeEvent = officeEvent;
      this.applyOfficeEvent(officeEvent);
    }
    this.stations.forEach((station) => station.update(elapsedMs, this.reducedMotion.matches));
    this.ambient.update(this.reducedMotion.matches ? 0 : elapsedMs);
    this.boss?.update(elapsedMs, this.reducedMotion.matches);
    if (!this.reducedMotion.matches) this.showAmbientChatter(elapsedMs);
    for (let index = this.popups.length - 1; index >= 0; index -= 1) {
      const popup = this.popups[index];
      if (!popup.update(elapsedMs)) {
        this.popups.splice(index, 1);
        popup.destroy();
      }
    }
  }

  clearPhrases(): void {
    this.popups.splice(0).forEach((popup) => popup.destroy());
    this.nextChatterAt = 0;
  }

  destroy(options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
    this.clearPhrases();
    super.destroy(options);
  }

  private createStations(): void {
    this.options.players.forEach((player, index) => {
      const slot = stationSlots[index];
      if (!slot) return;
      const station = new LayeredWorkstation({
        renderer: this.options.renderer,
        manifest: this.options.manifest,
        player,
        slot,
        index,
        scale: slot.row === "back" ? 0.2 : 0.23,
        onSelect: (selected) => this.selectPlayer(selected),
      });
      this.stations.push(station);
      (slot.row === "back" ? this.backLayer : this.frontLayer).addChild(station);
    });
  }

  private applyOfficeEvent(event: OfficeEventType | null): void {
    this.stations.forEach((station) => station.setOfficeEvent(event));
  }

  private selectPlayer(player: Player): void {
    this.selectRank(player.rank, true);
    this.showPlayerPhrase(player);
  }

  private showAmbientChatter(elapsedMs: number): void {
    if (this.stations.length === 0) return;
    if (this.nextChatterAt === 0) {
      this.nextChatterAt = elapsedMs + 7000;
      return;
    }
    if (elapsedMs < this.nextChatterAt) return;

    const station = this.stations[this.chatterCursor % this.stations.length];
    this.chatterCursor += 1;
    this.nextChatterAt = elapsedMs + 11000;
    if (this.popups.length === 0) this.showPlayerPhrase(station.player);
  }

  private showPlayerPhrase(player: Player): void {
    const station = this.stations.find((item) => item.player.rank === player.rank);
    if (!station) return;
    const anchor = station.popupAnchor();
    const phrase = randomWorkerPhrase(player.mode, this.previousPhrases.get(player.rank));
    this.previousPhrases.set(player.rank, phrase);
    this.showPhrase(phrase, anchor.x, anchor.y);
  }

  private showPhrase(text: string, x: number, y: number): void {
    this.popups.splice(0).forEach((previous) => previous.destroy());
    const popup = new WorkerPhrasePopup(text, x, y, this.options.popupMount);
    this.popups.push(popup);
    this.nextChatterAt = performance.now() + 11000;
  }

}

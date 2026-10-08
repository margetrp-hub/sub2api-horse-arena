export type DioramaAction = "idle" | "work" | "slack" | "caught" | "finished";

export type DioramaState = {
  action: DioramaAction;
  boss: "away" | "warning" | "inspecting";
};

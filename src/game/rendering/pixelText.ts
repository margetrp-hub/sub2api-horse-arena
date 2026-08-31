import { Text, TextStyle } from "pixi.js";

const fontFamily = "\"Cascadia Mono\", \"Cascadia Code\", \"Microsoft YaHei UI\", \"Microsoft YaHei\", monospace";

export function pixelText(value: string, size: number, fill: string | number): Text {
  const text = new Text(
    value,
    new TextStyle({
      fontFamily,
      fontSize: size,
      fontWeight: "700",
      fill,
      lineJoin: "round",
    }),
  );
  // Keep small UI labels crisp after the scene is scaled down for the netbar layout.
  text.resolution = 2;
  return text;
}

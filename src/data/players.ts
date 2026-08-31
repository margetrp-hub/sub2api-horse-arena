import type { Player } from "../types";

export const players: Player[] = [
  { rank: 1, name: "155***@qq.com", tokens: 3867.2, state: "API 冲刺中", mode: "working", screen: "dashboard" },
  { rank: 2, name: "ada***@gmail.com", tokens: 3012.8, state: "脚本巡检中", mode: "working", screen: "api" },
  { rank: 3, name: "wolf***@outlook.com", tokens: 2688.4, state: "LOL 摸鱼中", mode: "gaming", screen: "moba" },
  { rank: 4, name: "cs2***@foxmail.com", tokens: 2214.1, state: "CS2 开黑中", mode: "gaming", screen: "shooter" },
  { rank: 5, name: "video***@qq.com", tokens: 1960.6, state: "看番充电", mode: "gaming", screen: "video" },
  { rank: 6, name: "你自己", tokens: 1310.7, state: "工作中", mode: "working", screen: "download", self: true },
  { rank: 7, name: "rank***@qq.com", tokens: 1188.3, state: "盯排行榜", mode: "working", screen: "rank" },
  { rank: 8, name: "card***@gmail.com", tokens: 996.9, state: "纸牌摸鱼", mode: "gaming", screen: "card" },
  { rank: 9, name: "afk***@qq.com", tokens: 620.4, state: "睡着了", mode: "sleep", screen: "afk" },
  { rank: 10, name: "fish***@qq.com", tokens: 512.6, state: "钓鱼中", mode: "sleep", screen: "fishing" },
];

export function formatTokens(value: number): string {
  const tokens = Math.max(0, Number(value) || 0) * 10000;
  return tokens === 0 ? "0" : tokens.toExponential(2);
}

export function selfPlayer(): Player {
  return players.find((player) => player.self) ?? players[0];
}

export function emptyPlayers(): Player[] {
  const screens: Player["screen"][] = [
    "dashboard",
    "api",
    "moba",
    "shooter",
    "video",
    "download",
    "rank",
    "card",
    "afk",
    "fishing",
  ];
  return Array.from({ length: 10 }, (_, index) => ({
    rank: index + 1,
    name: "空闲工位",
    tokens: 0,
    state: "等待数据",
    mode: "sleep" as const,
    screen: screens[index],
  }));
}

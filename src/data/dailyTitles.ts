import type { Player } from "../types";

const titles = [
  "进度条骑士",
  "键盘副驾",
  "工位守夜人",
  "接口驯兽师",
  "日报幸存者",
  "超时谈判员",
  "咖啡续命官",
  "需求漂流瓶",
  "表格考古学家",
  "鼠标耐力王",
  "会议隐身术士",
  "缓存清道夫",
  "排队区钓鱼王",
  "截图收藏家",
  "工单搬运工",
  "日志寻宝员",
  "准点下班候补",
  "老板雷达员",
  "键帽保养师",
  "接口夜行者",
  "本周稳健输出",
  "摸鱼边缘人",
  "进程观察员",
  "错误码翻译官",
  "需求回旋镖",
  "云端打字员",
  "工位气氛组",
  "排障冲刺手",
  "静音加班侠",
  "茶水间情报员",
];

function dayKey(now = Date.now()): string {
  const shanghaiMs = now + 8 * 60 * 60 * 1000;
  return new Date(shanghaiMs).toISOString().slice(0, 10);
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function dailyTitle(player: Pick<Player, "rank" | "userId" | "name" | "mode">, now = Date.now()): string {
  if (player.rank === 1) return "本周卷王";
  if (player.rank === 2) return "键盘副驾";
  if (player.rank === 3) return "进度条骑士";
  const key = `${dayKey(now)}:${player.userId ?? player.name}:${player.mode}`;
  return titles[hash(key) % titles.length];
}

import http from "node:http";

const port = Number(process.env.MOCK_PORT || 8790);
const now = Math.floor(Date.now() / 1000);

const ranking = [
  { user_id: 2, email: "second@example.com", tokens: 1200, requests: 8, actual_cost: 99 },
  { user_id: 1, email: "first@example.com", tokens: 9200, requests: 4, actual_cost: 1 },
  { user_id: 3, email: "third@example.com", tokens: 4400, requests: 12, actual_cost: 2 },
];

function json(res, body) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.url?.includes("users-ranking")) {
    json(res, { code: 0, message: "success", data: { ranking, total_tokens: 14800 } });
    return;
  }
  if (req.url?.includes("users-trend")) {
    json(res, {
      code: 0,
      message: "success",
      data: {
        trend: ranking.map((row) => ({ ...row, date: new Date(now * 1000).toISOString().slice(0, 10) })),
      },
    });
    return;
  }
  json(res, { code: 404, message: "not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`mock ranking upstream listening on 127.0.0.1:${port}`);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import { root, copyTracked, copyDist, prepare, finish } from './lite-artifacts.mjs';

process.env.GAME_BASE_PATH = '/';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], { cwd: root, stdio: 'inherit' });
await build();
const info = await prepare('oh-haolema');
await copyDist(info.stage);
for (const file of ['server', 'LICENSE', 'NOTICE.md']) await copyTracked(info.stage, file);
await copyTracked(info.stage, 'deploy/lite', '');
await copyTracked(info.stage, 'deploy/game-api.env.example', '.env.example');
// A caller edits one .env; web startup derives source from it too.
await fs.appendFile(path.join(info.stage, '.env.example'), '\nGAME_PORT=8098\n');
await finish(info);

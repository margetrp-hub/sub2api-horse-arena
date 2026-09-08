import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../public/auth-return.js', import.meta.url), 'utf8');
const key = 'oh-haolema:login-return';
function setup({source = 'newapi', path = '/sign-in', pending = {path:'/game/lottery.html',createdAt:Date.now()}, response, storageDenied = false, search = ''} = {}) {
  const stored = new Map(pending ? [[key, JSON.stringify(pending)]] : []);
  const requests = [], redirects = [];
  let tick = () => {}, now = Date.now();
  const location = { pathname:path, search, replace:target => redirects.push(target) };
  const storage = {getItem:key => {if(storageDenied) throw Error('blocked');return stored.get(key) || null;}, removeItem:key => stored.delete(key)};
  const context = vm.createContext({
    window:{location, addEventListener(){}}, document:{currentScript:{dataset:{source}},visibilityState:'visible'},
    sessionStorage:storage, localStorage:{getItem:()=>'fixture-session'}, navigator:{locks:{request:async (_,__,action)=>action()}},
    Date:class extends Date {static now(){return now;}}, URLSearchParams, AbortSignal, setTimeout,
    setInterval:callback => {tick=callback;return 1;}, clearInterval(){},
    fetch:async (url, options) => {requests.push({url,options});return response || {ok:true,status:200,json:async()=>({success:true,data:{user:{id:4}}})};},
  });
  vm.runInContext(script, context);
  return {requests,redirects,stored,location,context,tick:()=>tick(),advance:ms=>{now+=ms;}};
}

test('ordinary host sessions have no game navigation or auth requests', async()=>{
  const state=setup({pending:null,path:'/dashboard'});await state.tick();
  assert.deepEqual(state.redirects,[]);assert.deepEqual(state.requests,[]);
});
test('SPA destination becomes a real game document load and consumes the intent', async()=>{
  const state=setup();state.location.pathname='/game/lottery.html';await state.tick();await state.tick();
  assert.deepEqual(state.redirects,['/game/lottery.html']);assert.equal(state.stored.has(key),false);assert.equal(state.requests.length,0);
});
test('all supported game pages can return to their original location', async()=>{
  for(const path of ['/game/','/game/index.html','/game/game.html','/game/station.html']){
    const state=setup({pending:{path,createdAt:Date.now()}});state.location.pathname=path;await state.tick();
    assert.deepEqual(state.redirects,[path]);
  }
});
test('external, malformed, expired and future destinations never navigate', async()=>{
  const invalid=[{path:'https://other.invalid',createdAt:Date.now()},{path:'//other.invalid',createdAt:Date.now()},{path:'/game/lottery.html?token=private',createdAt:Date.now()},{path:'/game/../api/user',createdAt:Date.now()},{path:'/game/',createdAt:Date.now()-900001},{path:'/game/',createdAt:Date.now()+60000}];
  for(const pending of invalid){const state=setup({pending,path:'/dashboard'});await state.tick();assert.deepEqual(state.redirects,[]);assert.equal(state.requests.length,0);}
});
test('failed login and 2FA screens never redirect or trigger refresh', async()=>{
  const state=setup();for(const path of ['/sign-in','/otp','/forgot-password','/sign-up','/']){state.location.pathname=path;await state.tick();}
  assert.equal(state.requests.length,0);assert.deepEqual(state.redirects,[]);
});
test('NewAPI dashboard fallback validates the existing refresh session', async()=>{
  const state=setup();state.location.pathname='/dashboard';await state.tick();
  assert.deepEqual(state.redirects,['/game/lottery.html']);assert.equal(state.requests[0].url,'/api/user/auth/refresh');
  assert.equal(state.requests[0].options.credentials,'include');assert.equal(state.requests[0].options.redirect,'error');
  assert.equal(state.requests[0].options.body,undefined);
});
test('Sub2API dashboard fallback validates the current user on this origin', async()=>{
  const state=setup({source:'sub2api',response:{ok:true,status:200,json:async()=>({code:0,data:{id:9}})}});
  state.location.pathname='/admin/dashboard';await state.tick();
  assert.equal(state.requests[0].url,'/api/v1/auth/me');assert.equal(state.requests[0].options.headers.Authorization,'Bearer fixture-session');
  assert.deepEqual(state.redirects,['/game/lottery.html']);
});
test('rejected and malformed authentication do not count as login success', async()=>{
  for(const response of [{ok:false,status:401,json:async()=>({success:false})},{ok:true,status:200,json:async()=>({success:true,data:{user:{id:0}}})}]){
    const state=setup({response});state.location.pathname='/dashboard';await state.tick();
    assert.deepEqual(state.redirects,[]);assert.equal(state.stored.has(key),true);
  }
});
test('auth errors retry a bounded number of times without tight polling', async()=>{
  const state=setup({response:{ok:false,status:503,json:async()=>({success:false})}});state.location.pathname='/dashboard';
  for(let attempt=0;attempt<10;attempt++){await state.tick();state.advance(6000);}
  assert.equal(state.requests.length,4);assert.deepEqual(state.redirects,[]);
});
test('changing page during session verification cancels the return', async()=>{
  const state=setup({response:{ok:true,status:200,json:async()=>{state.location.pathname='/wallet';return {success:true,data:{user:{id:1}}};}}});
  state.location.pathname='/dashboard';await state.tick();assert.deepEqual(state.redirects,[]);
});
test('blocked storage still permits the explicit safe redirect query', async()=>{
  const state=setup({pending:null,storageDenied:true,search:'?redirect=%2Fgame%2Flottery.html'});
  state.location.pathname='/game/lottery.html';await state.tick();assert.deepEqual(state.redirects,['/game/lottery.html']);
});

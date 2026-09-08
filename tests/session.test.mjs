import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:[new URL('../src/api/ranking.ts',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1')],bundle:true,write:false,format:'cjs',platform:'browser'});
const code=outputFiles[0].text;
function setup(){
  let now=1_800_000_000_000,calls=0,handler;
  const listeners=new Map(),writes=[],events=[];let channel;
  const storage={getItem:()=>null,setItem:(...values)=>writes.push(values)};
  const response=(status=200,user=7,expires=now/1000+3600)=>({status,ok:status===200,headers:{get:()=>status===429?'120':null},json:async()=>status===200?{success:true,data:{user:{id:user},access_token:'test-'+user,access_expires_at:expires}}:{success:false}});
  handler=()=>response();
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,URL,URLSearchParams,AbortSignal,Event,setTimeout,
    Date:class extends Date{static now(){return now;}},
    window:{OH_HAOLEMA_RUNTIME:{source:'newapi'},location:{search:'',href:'https://test.invalid/game/',origin:'https://test.invalid',protocol:'https:'},localStorage:storage,setTimeout,
      addEventListener:(type,fn)=>listeners.set(type,fn),dispatchEvent:event=>events.push(event.type)},
    navigator:{locks:{request:async(_,__,fn)=>fn()}},
    BroadcastChannel:class{constructor(name){assert.equal(name,'new-api:auth-session');channel=this;}addEventListener(_,fn){this.receive=fn;}},
    fetch:async()=>{calls++;return handler();},
  });
  return {api:module.exports,response,calls:()=>calls,writes,events,advance:ms=>{now+=ms;},setHandler:fn=>{handler=fn;},
    broadcast:kind=>channel.receive({data:{kind,sid:'verified-session',timestamp:now}}),storage:value=>listeners.get('storage')(value)};
}
test('frequent ranking and points reads reuse valid memory-only auth',async()=>{
  const state=setup();
  for(let i=0;i<20;i++){const headers=await state.api.authenticatedSessionHeaders();assert.equal(headers.Authorization,'Bearer test-7');state.advance(30000);}
  assert.equal(state.calls(),2);assert.deepEqual(state.writes,[]);
});
test('anonymous polling does not refresh on every account read',async()=>{
  const state=setup();state.setHandler(()=>state.response(401));
  for(let i=0;i<20;i++){assert.equal((await state.api.authenticatedSessionHeaders()).Authorization,undefined);state.advance(30000);}
  assert.equal(state.calls(),2);
});
test('token expiry is respected before the five minute cap',async()=>{
  const state=setup();state.setHandler(()=>state.response(200,7,1_800_000_090));
  await state.api.authenticatedSessionHeaders();state.advance(31000);await state.api.authenticatedSessionHeaders();assert.equal(state.calls(),2);
});

test('simultaneous points and ranking consumers share one refresh',async()=>{
  const state=setup();await Promise.all(Array.from({length:8},()=>state.api.authenticatedSessionHeaders()));assert.equal(state.calls(),1);
});
test('host sign-out clears old identity immediately without rotating cookies',async()=>{
  const state=setup();await state.api.authenticatedSessionHeaders();state.broadcast('signed_out');
  assert.equal((await state.api.authenticatedSessionHeaders()).Authorization,undefined);assert.equal(state.calls(),1);
  assert.deepEqual(state.events,['oh-haolema:session']);
});
test('host account switch reads and returns only the new verified identity',async()=>{
  const state=setup();await state.api.authenticatedSessionHeaders();state.setHandler(()=>state.response(200,9));state.broadcast('authenticated');
  assert.equal((await state.api.authenticatedSessionHeaders())['New-Api-User'],'9');assert.equal(state.calls(),2);
});
test('in-flight refresh cannot restore an identity after logout',async()=>{
  const state=setup();let resolve;state.setHandler(()=>new Promise(done=>{resolve=done;}));
  const pending=state.api.authenticatedSessionHeaders();state.broadcast('signed_out');resolve(state.response());
  await assert.rejects(pending,/登录状态已变更/);assert.equal((await state.api.authenticatedSessionHeaders()).Authorization,undefined);
});
test('429 respects Retry-After without repeated refresh requests',async()=>{
  const state=setup();state.setHandler(()=>state.response(429));
  await assert.rejects(state.api.authenticatedSessionHeaders());state.advance(60000);await assert.rejects(state.api.authenticatedSessionHeaders());assert.equal(state.calls(),1);
  state.advance(60001);state.setHandler(()=>state.response());await state.api.authenticatedSessionHeaders();assert.equal(state.calls(),2);
});
test('backend rejection evicts only the matching cached session',async()=>{
  const state=setup();await state.api.authenticatedSessionHeaders();state.api.rejectAuthenticatedSession('Bearer stale-other-user');
  await state.api.authenticatedSessionHeaders();assert.equal(state.calls(),1);
  state.api.rejectAuthenticatedSession('Bearer test-7');await state.api.authenticatedSessionHeaders();assert.equal(state.calls(),2);
});
test('legacy storage changes and host storage fallback invalidate auth',async()=>{
  const state=setup();await state.api.authenticatedSessionHeaders();state.storage({key:'uid'});
  await state.api.authenticatedSessionHeaders();assert.equal(state.calls(),2);
  state.storage({key:'new-api:auth-session:event',newValue:JSON.stringify({kind:'signed_out',sid:'same-user',timestamp:1_800_000_000_000})});
  assert.equal((await state.api.authenticatedSessionHeaders()).Authorization,undefined);assert.equal(state.calls(),2);
});

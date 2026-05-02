// falkor-desktop v1.0.1 - Desktop control command queue
const VERSION = '1.0.1';
const CORS = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Pin'};
function jsonr(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{...CORS,'Content-Type':'application/json'}});}
function pinOk(req,env){const p=req.headers.get('X-Pin')||'';if(!env.AGENT_PIN)return true;return p===env.AGENT_PIN;}
const CREATE_SQL="CREATE TABLE IF NOT EXISTS desktop_commands (id INTEGER PRIMARY KEY AUTOINCREMENT, command TEXT NOT NULL, intent TEXT DEFAULT '', status TEXT DEFAULT 'pending', result TEXT DEFAULT '', error TEXT DEFAULT '', requested_by TEXT DEFAULT 'falkor', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)";
const SETUP_SCRIPT="#!/usr/bin/env python3\\n# falkor-desktop local agent - polls and runs commands from Falkor\\n# Install: pip install pyautogui pillow requests\\nimport time, subprocess\\nimport requests\\n\\nURL = 'https://falkor-desktop.luckdragon.io'\\nPIN = 'YOUR_AGENT_PIN_HERE'\\nPOLL = 3\\n\\ndef run(cmd, intent):\\n    try:\\n        import pyautogui\\n        c = cmd.lower()\\n        if 'screenshot' in c or intent == 'screenshot':\\n            import datetime\\n            f = 'ss_' + datetime.datetime.now().strftime('%H%M%S') + '.png'\\n            pyautogui.screenshot(f)\\n            return {'ok': True, 'result': 'Screenshot: ' + f}\\n        elif c.startswith('open '):\\n            subprocess.Popen(['start', c[5:].strip()], shell=True)\\n            return {'ok': True, 'result': 'Opened: ' + c[5:].strip()}\\n        else:\\n            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)\\n            return {'ok': True, 'result': (r.stdout or r.stderr or 'Done').strip()}\\n    except Exception as e:\\n        return {'ok': False, 'error': str(e)}\\n\\nprint('Falkor desktop agent running. Ctrl+C to stop.')\\nwhile True:\\n    try:\\n        r = requests.get(URL + '/pending', headers={'X-Pin': PIN}, timeout=10)\\n        if r.ok:\\n            for c in r.json().get('commands', []):\\n                print('[' + str(c['id']) + '] ' + c['command'])\\n                res = run(c['command'], c.get('intent', ''))\\n                requests.post(URL + '/result/' + str(c['id']), json=res, headers={'X-Pin': PIN})\\n    except Exception as e:\\n        print('Error:', e)\\n    time.sleep(POLL)";
async function initDB(env){await env.DESKTOP_DB.exec(CREATE_SQL);}
export default {
  async fetch(req,env){
    const url=new URL(req.url);
    const path=url.pathname;
    const method=req.method;
    if(method==='OPTIONS')return new Response(null,{headers:CORS});
    try{await initDB(env);}catch(e){}
    if(path==='/health'){
      let total=0,pending=0;
      try{const s=await env.DESKTOP_DB.prepare('SELECT COUNT(*) as n FROM desktop_commands').first();total=s&&s.n||0;}catch(e){}
      try{const s=await env.DESKTOP_DB.prepare('SELECT COUNT(*) as n FROM desktop_commands WHERE status="pending"').first();pending=s&&s.n||0;}catch(e){}
      return jsonr({ok:true,worker:'falkor-desktop',version:VERSION,total,pending});
    }
    if(path==='/setup'){return new Response(SETUP_SCRIPT,{headers:{...CORS,'Content-Type':'text/plain','Content-Disposition':'attachment; filename="falkor-desktop-agent.py"'}});}
    if(!pinOk(req,env))return jsonr({error:'Unauthorized'},401);
    if(path==='/command'&&method==='POST'){
      try{
        const b=await req.json().catch(()=>({}));
        if(!b.command)return jsonr({error:'command required'},400);
        const r=await env.DESKTOP_DB.prepare('INSERT INTO desktop_commands (command,intent,requested_by) VALUES (?,?,?)').bind(b.command,b.intent||'',b.requested_by||'falkor').run();
        return jsonr({ok:true,id:r.meta&&r.meta.last_row_id,command:b.command,status:'pending'});
      }catch(e){return jsonr({error:e.message},500);}
    }
    if(path==='/pending'){
      try{
        const rows=await env.DESKTOP_DB.prepare('SELECT id,command,intent FROM desktop_commands WHERE status="pending" ORDER BY created_at ASC LIMIT 5').all();
        const res=rows.results||[];
        if(res.length>0){const ids=res.map(r=>r.id).join(',');await env.DESKTOP_DB.exec('UPDATE desktop_commands SET status="running",updated_at=CURRENT_TIMESTAMP WHERE id IN ('+ids+')');}
        return jsonr({commands:res});
      }catch(e){return jsonr({commands:[],error:e.message});}
    }
    const rm=path.match(/^\/result\/(\d+)$/);
    if(rm&&method==='POST'){
      try{
        const id=parseInt(rm[1]);
        const b=await req.json().catch(()=>({}));
        await env.DESKTOP_DB.prepare('UPDATE desktop_commands SET status=?,result=?,error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.ok!==false?'done':'error',b.result||'',b.error||'',id).run();
        return jsonr({ok:true});
      }catch(e){return jsonr({error:e.message},500);}
    }
    if(path==='/commands'){
      try{
        if(method==='DELETE'){await env.DESKTOP_DB.exec('DELETE FROM desktop_commands WHERE status IN ("done","error")');return jsonr({ok:true});}
        const limit=parseInt(url.searchParams.get('limit')||'20');
        const rows=await env.DESKTOP_DB.prepare('SELECT id,command,intent,status,result,error,requested_by,created_at FROM desktop_commands ORDER BY created_at DESC LIMIT ?').bind(limit).all();
        return jsonr({commands:rows.results||[]});
      }catch(e){return jsonr({error:e.message},500);}
    }
    return jsonr({error:'Not found',path},404);
  }
};

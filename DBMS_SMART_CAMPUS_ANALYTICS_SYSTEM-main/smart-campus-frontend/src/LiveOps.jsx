// LiveOps.jsx  —  Drop this file into src/
// Then in App.jsx add:
//   import LiveOpsPage from './LiveOps.jsx'
//   NAV: { id:'liveops', icon:Radio, label:'Live Operations' }
//   Page render: {page==='liveops' && <LiveOpsPage data={data} onRefresh={fetchData}/>}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap, Calendar, Wrench, Shield, Play, RefreshCcw,
  CheckCircle2, XCircle, AlertTriangle, Clock, Activity,
  Send, Radio, Database, ChevronDown, Loader,
  ArrowUpRight, Wifi, BarChart2,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

// ── palette ──────────────────────────────────────────────────
const C = {
  blue:'#3B82F6', violet:'#8B5CF6', emerald:'#10B981',
  amber:'#F59E0B', rose:'#F43F5E', cyan:'#06B6D4', teal:'#14B8A6',
};

const severityColor = s => ({ error:C.rose, warning:C.amber, success:C.emerald, info:C.blue }[s]||C.blue);
const severityIcon  = s => ({ error:'🔴', warning:'🟡', success:'🟢', info:'🔵' }[s]||'⚪');

// ── auth header helper ────────────────────────────────────────
const authHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('sc_token') ?? ''}`,
});

// ── tiny helpers ──────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:10, fontWeight:700, color:'#475569',
        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%', background:'#060F1C', border:'1px solid #1E293B',
  borderRadius:8, padding:'9px 12px', color:'#E2E8F0',
  fontSize:12, fontWeight:600, outline:'none', boxSizing:'border-box',
  transition:'border-color 0.15s',
};

const selectStyle = { ...inputStyle, cursor:'pointer' };

function Btn({ onClick, loading, color=C.blue, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{
        padding:'10px 18px', borderRadius:10, border:'none', cursor: disabled||loading ? 'not-allowed':'pointer',
        background: disabled||loading ? '#1E293B' : color+'25',
        color: disabled||loading ? '#334155' : color,
        fontWeight:800, fontSize:12, display:'flex', alignItems:'center', gap:6,
        border:`1px solid ${disabled||loading?'#1E293B':color+'40'}`,
        transition:'all 0.15s', width:'100%', justifyContent:'center',
      }}>
      {loading ? <Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/> : null}
      {children}
    </button>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3500); return ()=>clearTimeout(t); },[onClose]);
  const col = type==='success'?C.emerald : type==='error'?C.rose : C.amber;
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background:'#0A1628', border:`1px solid ${col}40`,
      borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:10,
      boxShadow:`0 8px 32px ${col}20`, maxWidth:380, animation:'slideUp 0.3s ease',
    }}>
      {type==='success'?<CheckCircle2 size={16} style={{ color:col, flexShrink:0 }}/>
       :type==='error'?<XCircle size={16} style={{ color:col, flexShrink:0 }}/>
       :<AlertTriangle size={16} style={{ color:col, flexShrink:0 }}/>}
      <span style={{ fontSize:12, fontWeight:700, color:'#E2E8F0', flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#334155', cursor:'pointer', padding:0 }}>✕</button>
    </div>
  );
}

function FormCard({ title, icon:Icon, color, children }) {
  return (
    <div style={{ background:'#0A1628', border:`1px solid ${color}30`,
      borderRadius:16, padding:20, boxShadow:`0 0 0 1px ${color}08` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <div style={{ padding:7, borderRadius:8, background:color+'18' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <h3 style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', margin:0 }}>{title}</h3>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  LIVE FEED TICKER
// ══════════════════════════════════════════════════════════════
function LiveFeed({ events }) {
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=0; },[events]);
  return (
    <div ref={ref} style={{ maxHeight:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
      {events.length===0 && (
        <div style={{ textAlign:'center', padding:'24px 0', color:'#334155', fontSize:11 }}>
          No events yet — insert data to see live activity
        </div>
      )}
      {events.map((e,i)=>(
        <div key={i} style={{
          display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
          borderRadius:10, background:'#060F1C', border:`1px solid ${severityColor(e.severity)}20`,
          animation: i===0 ? 'fadeIn 0.4s ease' : 'none',
        }}>
          <span style={{ fontSize:12, flexShrink:0, marginTop:1 }}>{severityIcon(e.severity)}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:10, fontWeight:800, color:severityColor(e.severity),
                textTransform:'uppercase', letterSpacing:'0.07em' }}>{e.event_type}</span>
              <span style={{ fontSize:9, color:'#334155', fontFamily:'monospace', flexShrink:0 }}>
                {e.event_time?.split(' ')[1]??''}
              </span>
            </div>
            <p style={{ fontSize:11, color:'#94A3B8', margin:'2px 0 0', fontWeight:600,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  AUTO-REFRESH COUNTDOWN
// ══════════════════════════════════════════════════════════════
function RefreshTimer({ interval=30, onTick }) {
  const [secs, setSecs] = useState(interval);
  useEffect(()=>{
    const iv = setInterval(()=>{
      setSecs(s=>{
        if(s<=1){ onTick(); return interval; }
        return s-1;
      });
    },1000);
    return ()=>clearInterval(iv);
  },[interval,onTick]);
  const pct = ((interval-secs)/interval)*100;
  const col = secs<=5?C.rose:secs<=10?C.amber:C.emerald;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <svg width={28} height={28} viewBox="0 0 28 28">
        <circle cx={14} cy={14} r={11} fill="none" stroke="#1E293B" strokeWidth={3}/>
        <circle cx={14} cy={14} r={11} fill="none" stroke={col} strokeWidth={3}
          strokeDasharray={`${2*Math.PI*11}`}
          strokeDashoffset={`${2*Math.PI*11*(1-pct/100)}`}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
      </svg>
      <span style={{ fontSize:11, fontWeight:700, color:col, fontVariantNumeric:'tabular-nums' }}>
        {secs}s
      </span>
      <span style={{ fontSize:10, color:'#334155', fontWeight:600 }}>next refresh</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function LiveOpsPage({ data, onRefresh }) {
  // Lookups
  const rooms  = data?.lookups?.rooms  ?? [];
  const users  = data?.lookups?.users  ?? [];
  const meters = data?.lookups?.meters ?? [];

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => setToast({ msg, type });

  // Live feed
  const [feed, setFeed]       = useState(data?.live_feed ?? []);
  const [polling, setPolling] = useState(false);

  // ── FIX 1: pollFeed now sends auth token ──────────────────
  const pollFeed = useCallback(async () => {
    setPolling(true);
    try {
      const r = await fetch(`${API}/live-feed`, {
        headers: { ...authHeader() },
      });
      const d = await r.json();
      setFeed(d.feed ?? []);
    } catch { /* backend offline — keep existing feed */ }
    finally { setPolling(false); }
  }, []);

  // Poll feed every 10 seconds
  useEffect(()=>{ pollFeed(); const iv=setInterval(pollFeed,10000); return ()=>clearInterval(iv); },[pollFeed]);

  // ── Form states ───────────────────────────────────────────
  const [energyForm, setEnergyForm] = useState({ meter_id:'', kwh_consumed:'', voltage:'230', peak_flag:'0' });
  const [bookForm,   setBookForm]   = useState({ user_id:'', room_id:'', start_time:'', end_time:'', purpose:'' });
  const [ticketForm, setTicketForm] = useState({ room_id:'', reported_by:'', description:'', priority:'Medium' });
  const [accessForm, setAccessForm] = useState({ user_id:'', room_id:'', access_method:'RFID' });
  const [loadingMap, setLoadingMap] = useState({});

  const setLoading = (key, val) => setLoadingMap(p=>({ ...p, [key]:val }));

  // ── FIX 2: post now sends auth token ──────────────────────
  async function post(key, endpoint, body, successMsg, resetFn) {
    setLoading(key, true);
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Server error');
      showToast(successMsg, 'success');
      resetFn();
      setTimeout(()=>{ onRefresh?.(); pollFeed(); }, 600);
    } catch(e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(key, false);
    }
  }

  // ── FIX 3: patch now sends auth token ────────────────────
  async function patch(key, endpoint, body, successMsg) {
    setLoading(key, true);
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method:'PATCH',
        headers:{
          'Content-Type':'application/json',
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Server error');
      showToast(successMsg, 'success');
      setTimeout(()=>{ onRefresh?.(); pollFeed(); }, 600);
    } catch(e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(key, false);
    }
  }

  // ── FIX 4: runETL now sends auth token ───────────────────
  const [etlLog, setEtlLog] = useState('');
  async function runETL() {
    setLoading('etl', true);
    setEtlLog('Running ETL pipeline...');
    try {
      const res = await fetch(`${API}/run-etl`, {
        method:'POST',
        headers: { ...authHeader() },
      });
      const d   = await res.json();
      setEtlLog(d.log || (d.success ? 'ETL completed.' : 'ETL failed.'));
      showToast(d.success ? 'ETL pipeline completed!' : 'ETL failed — check log', d.success?'success':'error');
      if(d.success) onRefresh?.();
    } catch(e) {
      setEtlLog(e.message);
      showToast('Could not reach backend', 'error');
    } finally {
      setLoading('etl', false);
    }
  }

  // demo mode: use mock meters/rooms when backend offline
  const meterOpts  = meters.length  ? meters  : [{meter_id:1,meter_type:'Electricity'},{meter_id:2,meter_type:'Solar'},{meter_id:3,meter_type:'Water'}];
  const roomOpts   = rooms.length   ? rooms   : [{room_id:1,room_no:'C101'},{room_id:2,room_no:'L201'},{room_id:3,room_no:'Seminar Hall'}];
  const userOpts   = users.length   ? users   : [{user_id:1,name:'Dr Rao',user_type:'Faculty'},{user_id:2,name:'Kavya Reddy',user_type:'Student'}];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        input:focus, select:focus, textarea:focus { border-color: #3B82F6 !important; }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:#0A1628 }
        ::-webkit-scrollbar-thumb { background:#1E293B; border-radius:4px }
      `}</style>

      {/* ── Header Banner ── */}
      <div style={{
        background:'linear-gradient(135deg, #3B82F610, #8B5CF610)',
        border:'1px solid #3B82F630', borderRadius:16, padding:'16px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12,
            background:'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radio size={20} color="#fff"/>
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:900, color:'#F1F5F9', margin:0 }}>Live Operations Center</p>
            <p style={{ fontSize:10, color:'#475569', margin:0, fontWeight:600 }}>
              Insert data in real-time → SQL Server → auto-refresh dashboard
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <RefreshTimer interval={30} onTick={()=>{ onRefresh?.(); pollFeed(); }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:C.emerald,
              boxShadow:`0 0 8px ${C.emerald}`, display:'inline-block' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:C.emerald }}>Live</span>
          </div>
        </div>
      </div>

      {/* ── 4 Quick-Stat KPIs from live DB ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        {[
          { icon:Zap,      label:'Energy Readings', val: data?.kpis?.meters   ?? '—', color:C.amber   },
          { icon:Calendar, label:'Total Bookings',  val: data?.kpis?.bookings ?? '—', color:C.blue    },
          { icon:Wrench,   label:'Open Tickets',    val: data?.kpis?.tickets  ?? '—', color:C.rose    },
          { icon:Shield,   label:'Access Events',   val: data?.kpis?.access_logs??'—',color:C.violet  },
        ].map((k,i)=>(
          <div key={i} style={{
            background:'#0A1628', border:`1px solid ${k.color}25`, borderRadius:14, padding:16,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{ padding:10, borderRadius:10, background:k.color+'18', color:k.color }}>
              <k.icon size={18}/>
            </div>
            <div>
              <p style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', margin:0, lineHeight:1 }}>{k.val}</p>
              <p style={{ fontSize:9, fontWeight:700, color:k.color, textTransform:'uppercase',
                letterSpacing:'0.08em', margin:'4px 0 0' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 2-column grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* ENERGY READING FORM */}
          <FormCard title="Log Energy Reading" icon={Zap} color={C.amber}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Meter">
                <select value={energyForm.meter_id} onChange={e=>setEnergyForm(p=>({...p,meter_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select meter…</option>
                  {meterOpts.map(m=><option key={m.meter_id} value={m.meter_id}>M-{m.meter_id} ({m.meter_type})</option>)}
                </select>
              </Field>
              <Field label="kWh Consumed">
                <input type="number" step="0.01" min="0.01" max="100" placeholder="e.g. 4.75"
                  value={energyForm.kwh_consumed}
                  onChange={e=>setEnergyForm(p=>({...p,kwh_consumed:e.target.value}))}
                  style={inputStyle}/>
              </Field>
              <Field label="Voltage (V)">
                <input type="number" step="0.1" placeholder="230"
                  value={energyForm.voltage}
                  onChange={e=>setEnergyForm(p=>({...p,voltage:e.target.value}))}
                  style={inputStyle}/>
              </Field>
              <Field label="Peak Hour?">
                <select value={energyForm.peak_flag} onChange={e=>setEnergyForm(p=>({...p,peak_flag:e.target.value}))} style={selectStyle}>
                  <option value="0">No (Off-Peak)</option>
                  <option value="1">Yes (Peak)</option>
                </select>
              </Field>
            </div>
            <Btn color={C.amber} loading={loadingMap.energy}
              disabled={!energyForm.meter_id || !energyForm.kwh_consumed}
              onClick={()=>post('energy','energy-reading',{
                meter_id:    parseInt(energyForm.meter_id),
                kwh_consumed:parseFloat(energyForm.kwh_consumed),
                voltage:     parseFloat(energyForm.voltage)||230,
                peak_flag:   parseInt(energyForm.peak_flag),
              },'Energy reading inserted!', ()=>setEnergyForm({meter_id:'',kwh_consumed:'',voltage:'230',peak_flag:'0'}))}>
              <Send size={13}/> Insert Reading → SQL Server
            </Btn>
          </FormCard>

          {/* ROOM BOOKING FORM */}
          <FormCard title="Create Room Booking" icon={Calendar} color={C.blue}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="User">
                <select value={bookForm.user_id} onChange={e=>setBookForm(p=>({...p,user_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select user…</option>
                  {userOpts.map(u=><option key={u.user_id} value={u.user_id}>{u.name} ({u.user_type})</option>)}
                </select>
              </Field>
              <Field label="Room">
                <select value={bookForm.room_id} onChange={e=>setBookForm(p=>({...p,room_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select room…</option>
                  {roomOpts.map(r=><option key={r.room_id} value={r.room_id}>{r.room_no}</option>)}
                </select>
              </Field>
              <Field label="Start Time">
                <input type="datetime-local" value={bookForm.start_time}
                  onChange={e=>setBookForm(p=>({...p,start_time:e.target.value}))} style={inputStyle}/>
              </Field>
              <Field label="End Time">
                <input type="datetime-local" value={bookForm.end_time}
                  onChange={e=>setBookForm(p=>({...p,end_time:e.target.value}))} style={inputStyle}/>
              </Field>
            </div>
            <Field label="Purpose">
              <input type="text" placeholder="e.g. DBMS Lab Session"
                value={bookForm.purpose}
                onChange={e=>setBookForm(p=>({...p,purpose:e.target.value}))}
                style={inputStyle}/>
            </Field>
            <Btn color={C.blue} loading={loadingMap.booking}
              disabled={!bookForm.user_id||!bookForm.room_id||!bookForm.start_time||!bookForm.purpose}
              onClick={()=>post('booking','booking',{
                user_id:   parseInt(bookForm.user_id),
                room_id:   parseInt(bookForm.room_id),
                start_time:bookForm.start_time.replace('T',' '),
                end_time:  bookForm.end_time.replace('T',' ') || bookForm.start_time.replace('T',' '),
                purpose:   bookForm.purpose,
              },'Booking created!', ()=>setBookForm({user_id:'',room_id:'',start_time:'',end_time:'',purpose:''}))}>
              <Send size={13}/> Submit Booking → SQL Server
            </Btn>
          </FormCard>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* MAINTENANCE TICKET FORM */}
          <FormCard title="Raise Maintenance Ticket" icon={Wrench} color={C.rose}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Room">
                <select value={ticketForm.room_id} onChange={e=>setTicketForm(p=>({...p,room_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select room…</option>
                  {roomOpts.map(r=><option key={r.room_id} value={r.room_id}>{r.room_no}</option>)}
                </select>
              </Field>
              <Field label="Reported By">
                <select value={ticketForm.reported_by} onChange={e=>setTicketForm(p=>({...p,reported_by:e.target.value}))} style={selectStyle}>
                  <option value="">Select user…</option>
                  {userOpts.map(u=><option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={ticketForm.priority} onChange={e=>setTicketForm(p=>({...p,priority:e.target.value}))} style={selectStyle}>
                  {['Critical','High','Medium','Low'].map(p=><option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Description">
              <textarea rows={3} placeholder="Describe the issue…"
                value={ticketForm.description}
                onChange={e=>setTicketForm(p=>({...p,description:e.target.value}))}
                style={{ ...inputStyle, resize:'vertical' }}/>
            </Field>
            <Btn color={C.rose} loading={loadingMap.ticket}
              disabled={!ticketForm.room_id||!ticketForm.description||!ticketForm.reported_by}
              onClick={()=>post('ticket','maintenance-ticket',{
                room_id:     parseInt(ticketForm.room_id),
                reported_by: parseInt(ticketForm.reported_by),
                description: ticketForm.description,
                priority:    ticketForm.priority,
              },'Ticket raised!', ()=>setTicketForm({room_id:'',reported_by:'',description:'',priority:'Medium'}))}>
              <Send size={13}/> Raise Ticket → SQL Server
            </Btn>
          </FormCard>

          {/* ACCESS LOG FORM */}
          <FormCard title="Log Access Event" icon={Shield} color={C.violet}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="User">
                <select value={accessForm.user_id} onChange={e=>setAccessForm(p=>({...p,user_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select user…</option>
                  {userOpts.map(u=><option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                </select>
              </Field>
              <Field label="Room">
                <select value={accessForm.room_id} onChange={e=>setAccessForm(p=>({...p,room_id:e.target.value}))} style={selectStyle}>
                  <option value="">Select room…</option>
                  {roomOpts.map(r=><option key={r.room_id} value={r.room_id}>{r.room_no}</option>)}
                </select>
              </Field>
              <Field label="Auth Method">
                <select value={accessForm.access_method} onChange={e=>setAccessForm(p=>({...p,access_method:e.target.value}))} style={selectStyle}>
                  {['RFID','Biometric','PIN','Manual'].map(m=><option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <Btn color={C.violet} loading={loadingMap.access}
              disabled={!accessForm.user_id||!accessForm.room_id}
              onClick={()=>post('access','access-log',{
                user_id:       parseInt(accessForm.user_id),
                room_id:       parseInt(accessForm.room_id),
                access_method: accessForm.access_method,
              },'Access event logged!', ()=>setAccessForm({user_id:'',room_id:'',access_method:'RFID'}))}>
              <Send size={13}/> Log Access → SQL Server
            </Btn>
          </FormCard>

          {/* ETL TRIGGER */}
          <FormCard title="Trigger ETL Pipeline" icon={Database} color={C.teal}>
            <p style={{ fontSize:11, color:'#475569', margin:0, lineHeight:1.6 }}>
              Runs <span style={{ color:C.teal, fontFamily:'monospace', fontWeight:700 }}>etl_pipeline.py</span> to sync
              new OLTP readings → Warehouse (<code style={{ color:C.amber, fontSize:10 }}>fact_energy_consumption</code>).
              Use after inserting bulk energy readings.
            </p>
            <Btn color={C.teal} loading={loadingMap.etl} onClick={runETL}>
              <Play size={13}/> Run ETL Now
            </Btn>
            {etlLog && (
              <div style={{ background:'#060F1C', borderRadius:8, padding:'10px 12px',
                border:'1px solid #1E293B', maxHeight:100, overflowY:'auto' }}>
                <pre style={{ fontSize:9.5, color:'#475569', margin:0, fontFamily:'monospace',
                  lineHeight:1.6, whiteSpace:'pre-wrap' }}>{etlLog}</pre>
              </div>
            )}
          </FormCard>

        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <div style={{ background:'#0A1628', border:'1px solid #1E293B', borderRadius:16, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ padding:7, borderRadius:8, background:C.emerald+'18' }}>
              <Activity size={14} style={{ color:C.emerald }}/>
            </div>
            <h3 style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', margin:0 }}>Real-Time Activity Feed</h3>
            <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:999,
              background:C.emerald+'15', color:C.emerald, border:`1px solid ${C.emerald}25` }}>
              LIVE · 10s poll
            </span>
          </div>
          <button onClick={pollFeed} style={{ background:'#1E293B', border:'1px solid #334155',
            borderRadius:8, padding:'6px 10px', color:'#475569', cursor:'pointer', display:'flex',
            alignItems:'center', gap:6, fontSize:11, fontWeight:700 }}>
            {polling
              ? <Loader size={12} style={{ animation:'spin 0.8s linear infinite', color:C.emerald }}/>
              : <RefreshCcw size={12}/>}
            Refresh
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {/* Feed column */}
          <div>
            <LiveFeed events={feed}/>
          </div>
          {/* Stats column */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <p style={{ fontSize:9, fontWeight:700, color:'#334155', textTransform:'uppercase',
              letterSpacing:'0.1em', margin:0 }}>Feed Summary</p>
            {['Energy','Booking','Ticket','Access'].map((type,i)=>{
              const cnt = feed.filter(e=>e.event_type===type).length;
              const col = [C.amber,C.blue,C.rose,C.violet][i];
              return (
                <div key={type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 12px', borderRadius:10,
                  background:col+'08', border:`1px solid ${col}20` }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8' }}>{type} events</span>
                  <span style={{ fontSize:18, fontWeight:900, color:col }}>{cnt}</span>
                </div>
              );
            })}
            <div style={{ marginTop:'auto', padding:'12px', borderRadius:10,
              background:'#060F1C', border:'1px solid #1E293B', textAlign:'center' }}>
              <p style={{ fontSize:9, fontWeight:700, color:'#334155', textTransform:'uppercase',
                letterSpacing:'0.1em', margin:'0 0 4px' }}>Dashboard Auto-Refresh</p>
              <p style={{ fontSize:11, fontWeight:700, color:C.blue, margin:0 }}>Every 30 seconds</p>
              <p style={{ fontSize:9, color:'#334155', margin:'3px 0 0' }}>
                Feed polls every 10s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
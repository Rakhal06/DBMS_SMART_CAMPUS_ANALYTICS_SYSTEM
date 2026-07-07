import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
  ComposedChart, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  Zap, Users, Calendar, Building2, RefreshCcw, AlertCircle, LogOut,
  LayoutDashboard, Activity, Database, Clock, CheckCircle2,
  Wrench, Shield, TrendingUp, ChevronRight, ChevronLeft,
  Sun, AlertTriangle, BookOpen, LogIn, BarChart2, Filter,
  ChevronUp, ChevronDown, Server, Cpu, Leaf, DollarSign,
  Thermometer, Eye, Map, Settings, Bell, Hash, Layers,
  FlaskConical, MonitorCheck, ArrowUpRight, ArrowDownRight,
  CircuitBoard, Wind, Droplets, Radio, Target, Award,
  GitBranch, HardDrive, Gauge, Flame, BatteryCharging,
  Network, BarChart3, Table, Code2, Play,
} from 'lucide-react';
import LoginPage from './Login.jsx';
import LiveOpsPage from './LiveOps.jsx';
  // already imported, just add Radio
const API_URL = 'http://127.0.0.1:8000/api/dashboard-stats';

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  blue:    '#3B82F6', indigo: '#6366F1', violet: '#8B5CF6',
  emerald: '#10B981', amber:  '#F59E0B', rose:   '#F43F5E',
  cyan:    '#06B6D4', teal:   '#14B8A6', slate:  '#64748B',
  orange:  '#F97316', pink:   '#EC4899', lime:   '#84CC16',
  chart: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#F43F5E','#06B6D4','#EC4899','#84CC16','#F97316','#14B8A6'],
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK = {
  kpis: { energy: 87.34, rooms: 16, users: 109, bookings: 200, tickets: 18, access_logs: 208, equipment: 65, meters: 27 },
  buildings: [
    { building_name:'E Block',  total:4820, peak_kwh:2410, rooms_monitored:12 },
    { building_name:'PI Block', total:1230, peak_kwh:610,  rooms_monitored:3  },
    { building_name:'B Block',  total:980,  peak_kwh:490,  rooms_monitored:8  },
    { building_name:'G Block',  total:860,  peak_kwh:430,  rooms_monitored:8  },
    { building_name:'H Block',  total:540,  peak_kwh:270,  rooms_monitored:4  },
    { building_name:'M Block',  total:320,  peak_kwh:160,  rooms_monitored:2  },
  ],
  peak_ratio: [{ peak_flag:0, count:215 },{ peak_flag:1, count:300 }],
  hourly_trend: Array.from({length:24},(_,h)=>({ hour:h,
    avg_kwh: h<6?1.2+Math.random()*.8 : h<9?2.5+Math.random()*1.5 : h<18?5.0+Math.random()*2.5 : h<22?3.0+Math.random()*1.5 : 1.5+Math.random()*.5 })),
  user_roles: [{ label:'Student',value:76},{ label:'Faculty',value:15},{ label:'Staff',value:15},{ label:'Admin',value:3}],
  room_energy: [
    { room_no:'Seminar Hall', total_kwh:310.5, avg_kwh_per_hour:4.9, peak_kwh:72.1, room_type:'Seminar Hall' },
    { room_no:'L301',  total_kwh:248.2, avg_kwh_per_hour:6.1, peak_kwh:71.1, room_type:'Computer Lab'  },
    { room_no:'L201',  total_kwh:196.6, avg_kwh_per_hour:5.3, peak_kwh:60.7, room_type:'Computer Lab'  },
    { room_no:'C202',  total_kwh:183.3, avg_kwh_per_hour:3.8, peak_kwh:55.0, room_type:'Classroom'     },
    { room_no:'L202',  total_kwh:157.8, avg_kwh_per_hour:4.9, peak_kwh:52.2, room_type:'Computer Lab'  },
    { room_no:'L101',  total_kwh:95.1,  avg_kwh_per_hour:3.1, peak_kwh:30.1, room_type:'ECE Lab'       },
    { room_no:'C101',  total_kwh:87.3,  avg_kwh_per_hour:2.8, peak_kwh:28.4, room_type:'Classroom'     },
    { room_no:'C301',  total_kwh:72.4,  avg_kwh_per_hour:2.4, peak_kwh:21.0, room_type:'Classroom'     },
  ],
  booking_status: [
    { room_no:'Seminar Hall', approved:12, pending:3, cancelled:4,  rejected:2,  total_bookings:21 },
    { room_no:'C101',  approved:8,  pending:2, cancelled:2,  rejected:1,  total_bookings:13 },
    { room_no:'L301',  approved:10, pending:4, cancelled:3,  rejected:5,  total_bookings:22 },
    { room_no:'C202',  approved:7,  pending:1, cancelled:5,  rejected:3,  total_bookings:16 },
    { room_no:'L201',  approved:9,  pending:2, cancelled:1,  rejected:2,  total_bookings:14 },
    { room_no:'L101',  approved:5,  pending:3, cancelled:2,  rejected:4,  total_bookings:14 },
  ],
  tickets: [
    { ticket_id:5,  description:'GPU Server overheating',         priority:'Critical',status:'In Progress',room_no:'L301', reported_date:'2025-03-20' },
    { ticket_id:12, description:'Lights flickering in classroom',  priority:'Critical',status:'Open',       room_no:'C202', reported_date:'2025-02-09' },
    { ticket_id:21, description:'Water leakage near server rack',  priority:'Critical',status:'In Progress',room_no:'L303', reported_date:'2025-03-04' },
    { ticket_id:1,  description:'Projector bulb fused',            priority:'High',    status:'Resolved',   room_no:'Seminar Hall',reported_date:'2025-03-10' },
    { ticket_id:3,  description:'Computer #3 not booting',         priority:'High',    status:'Open',       room_no:'L201', reported_date:'2025-03-15' },
    { ticket_id:10, description:'Ceiling fan not working',         priority:'High',    status:'In Progress',room_no:'Mini Seminar',reported_date:'2025-04-24' },
    { ticket_id:55, description:'GPU server thermal warning',      priority:'High',    status:'In Progress',room_no:'L101', reported_date:'2025-04-26' },
    { ticket_id:2,  description:'AC not cooling properly',         priority:'Medium',  status:'In Progress',room_no:'Seminar Hall',reported_date:'2025-03-12' },
    { ticket_id:6,  description:'Classroom lights not working',    priority:'Medium',  status:'Resolved',   room_no:'C201', reported_date:'2025-03-22' },
    { ticket_id:4,  description:'Oscilloscope display flickering', priority:'Low',     status:'Open',       room_no:'L101', reported_date:'2025-03-18' },
  ],
  access_logs: [
    { log_id:208, name:'Kavya Reddy',  room_no:'L201',       method:'RFID',      entry_time:'2025-06-05 12:01', duration_min:135 },
    { log_id:207, name:'Ankita Shah',  room_no:'L201',       method:'Biometric', entry_time:'2025-06-05 12:23', duration_min:173 },
    { log_id:206, name:'Pradeep K.',   room_no:'L201',       method:'PIN',       entry_time:'2025-06-04 14:53', duration_min:54  },
    { log_id:205, name:'Amol Reddy',   room_no:'C301',       method:'RFID',      entry_time:'2025-06-04 08:44', duration_min:71  },
    { log_id:203, name:'Madhav Nair',  room_no:'L101',       method:'Manual',    entry_time:'2025-06-03 13:31', duration_min:64  },
    { log_id:202, name:'Ankita Shah',  room_no:'C201',       method:'PIN',       entry_time:'2025-06-02 09:51', duration_min:68  },
    { log_id:201, name:'Ravi Desai',   room_no:'L201',       method:'PIN',       entry_time:'2025-06-02 19:15', duration_min:172 },
    { log_id:200, name:'Pooja Desai',  room_no:'C102',       method:'RFID',      entry_time:'2025-06-02 16:43', duration_min:88  },
  ],
  meter_types: [
    { meter_type:'Electricity', count:11 },
    { meter_type:'Solar',       count:7  },
    { meter_type:'Water',       count:4  },
    { meter_type:'Gas',         count:5  },
  ],
  dept_energy: [
    { dept_name:'Computer Science & Engg',  total_kwh:524.4 },
    { dept_name:'Electronics & Comm.',       total_kwh:281.1 },
    { dept_name:'Data Science & AI',         total_kwh:199.9 },
  ],
  equipment_status: [
    { status:'Active',       count:65 },
    { status:'Inactive',     count:27 },
    { status:'Under Repair', count:18 },
  ],
  anomaly_readings: [
    { meter_id:17, timestamp:'2025-01-10 08:00', kwh_consumed:8.72, delta_kwh:null, anomaly_flag:'Normal'         },
    { meter_id:4,  timestamp:'2025-01-04 16:00', kwh_consumed:9.20, delta_kwh:3.6,  anomaly_flag:'SPIKE DETECTED' },
    { meter_id:18, timestamp:'2025-01-05 10:00', kwh_consumed:8.17, delta_kwh:null, anomaly_flag:'Normal'         },
    { meter_id:14, timestamp:'2025-01-02 12:00', kwh_consumed:9.49, delta_kwh:5.6,  anomaly_flag:'SPIKE DETECTED' },
    { meter_id:9,  timestamp:'2025-01-02 16:00', kwh_consumed:9.48, delta_kwh:4.2,  anomaly_flag:'SPIKE DETECTED' },
    { meter_id:21, timestamp:'2025-01-04 10:00', kwh_consumed:7.36, delta_kwh:2.3,  anomaly_flag:'Normal'         },
    { meter_id:3,  timestamp:'2025-01-03 10:00', kwh_consumed:7.1,  delta_kwh:0.9,  anomaly_flag:'Normal'         },
  ],
  weekly_trend: [
    { week:'W1 Jan', kwh:412.3, bookings:18 }, { week:'W2 Jan', kwh:389.1, bookings:22 },
    { week:'W3 Jan', kwh:445.7, bookings:19 }, { week:'W4 Jan', kwh:401.2, bookings:25 },
    { week:'W1 Feb', kwh:378.9, bookings:17 }, { week:'W2 Feb', kwh:422.4, bookings:28 },
    { week:'W3 Feb', kwh:466.1, bookings:24 }, { week:'W4 Feb', kwh:398.7, bookings:21 },
    { week:'W1 Mar', kwh:481.3, bookings:30 }, { week:'W2 Mar', kwh:512.8, bookings:35 },
  ],
  room_type_dist: [
    { type:'Computer Lab', count:6 }, { type:'Classroom', count:6 },
    { type:'ECE Lab', count:3 }, { type:'Seminar Hall', count:3 },
  ],
  solar_vs_electric: [
    { month:'Jan', solar:98.4,  electric:412.3 }, { month:'Feb', solar:110.2, electric:398.7 },
    { month:'Mar', solar:135.6, electric:481.3 }, { month:'Apr', solar:148.9, electric:455.2 },
    { month:'May', solar:162.1, electric:502.7 }, { month:'Jun', solar:155.4, electric:478.9 },
  ],
  equip_by_type: [
    { type:'Desktop',    count:18 }, { type:'AC',           count:12 },
    { type:'Projector',  count:10 }, { type:'FPGA Board',   count:20 },
    { type:'GPU Server', count:8  }, { type:'Oscilloscope', count:15 },
    { type:'Router',     count:12 }, { type:'Solar Inv.',   count:15 },
  ],
  booking_hourly: [
    { hour:'8AM', count:18 }, { hour:'9AM',  count:24 }, { hour:'10AM', count:31 },
    { hour:'11AM', count:28 }, { hour:'12PM', count:14 }, { hour:'1PM',  count:9  },
    { hour:'2PM',  count:22 }, { hour:'3PM',  count:29 }, { hour:'4PM',  count:27 },
    { hour:'5PM',  count:16 }, { hour:'6PM',  count:8  }, { hour:'7PM',  count:5  },
  ],
  monthly_bookings: [
    { month:'Jan', approved:38, pending:8, cancelled:5, rejected:4 },
    { month:'Feb', approved:44, pending:10,cancelled:7, rejected:3 },
    { month:'Mar', approved:52, pending:12,cancelled:6, rejected:6 },
    { month:'Apr', approved:48, pending:9, cancelled:8, rejected:5 },
    { month:'May', approved:61, pending:14,cancelled:9, rejected:4 },
    { month:'Jun', approved:57, pending:11,cancelled:7, rejected:7 },
  ],
  co2_trend: [
    { month:'Jan', kg:338 }, { month:'Feb', kg:327 }, { month:'Mar', kg:395 },
    { month:'Apr', kg:373 }, { month:'May', kg:412 }, { month:'Jun', kg:393 },
  ],
  etl_log: [
    { run_id:'ETL-009', run_date:'2025-03-31 02:00', rows_extracted:148, rows_cleaned:141, rows_loaded:141, duration_s:14.2, status:'Success' },
    { run_id:'ETL-008', run_date:'2025-03-30 02:00', rows_extracted:132, rows_cleaned:128, rows_loaded:128, duration_s:12.8, status:'Success' },
    { run_id:'ETL-007', run_date:'2025-03-29 02:00', rows_extracted:156, rows_cleaned:149, rows_loaded:149, duration_s:15.1, status:'Success' },
    { run_id:'ETL-006', run_date:'2025-03-28 02:00', rows_extracted:121, rows_cleaned:118, rows_loaded:118, duration_s:11.6, status:'Success' },
    { run_id:'ETL-005', run_date:'2025-03-27 02:00', rows_extracted:0,   rows_cleaned:0,   rows_loaded:0,   duration_s:2.1,  status:'No New Data' },
    { run_id:'ETL-004', run_date:'2025-03-26 02:00', rows_extracted:163, rows_cleaned:0,   rows_loaded:0,   duration_s:18.4, status:'Failed' },
    { run_id:'ETL-003', run_date:'2025-03-25 02:00', rows_extracted:144, rows_cleaned:138, rows_loaded:138, duration_s:13.9, status:'Success' },
  ],
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:'overview',       icon:LayoutDashboard, label:'Overview'         },
  { id:'energy',         icon:Activity,        label:'Energy Analysis'  },
  { id:'infrastructure', icon:Building2,        label:'Infrastructure'   },
  { id:'bookings',       icon:Calendar,         label:'Room Bookings'    },
  { id:'maintenance',    icon:Wrench,           label:'Maintenance'      },
  { id:'access',         icon:Shield,           label:'Access & Security'},
  { id:'users',          icon:Users,            label:'User Analytics'   },
  { id:'warehouse',      icon:Database,         label:'Data Warehouse'   },
  { id:'liveops', icon:Radio, label:'Live Operations', adminOnly:true },
  { id:'normalization',  icon:GitBranch,        label:'Normalization'    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n,d=1) => Number(n??0).toFixed(d);
const fmtK = n => n>=1000 ? `${(n/1000).toFixed(1)}K` : String(n);
const priorityColor = p => ({ Critical:'#F43F5E', High:'#F97316', Medium:'#FBBF24', Low:'#34D399' }[p]??'#94A3B8');
const statusCls = s => ({
  Open:        'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'In Progress':'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Resolved:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Closed:      'bg-slate-500/15 text-slate-400 border-slate-500/25',
  Approved:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Pending:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Cancelled:   'bg-slate-500/15 text-slate-400 border-slate-500/25',
  Rejected:    'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Completed:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Normal:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'SPIKE DETECTED': 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  Success:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Failed:      'bg-rose-500/15 text-rose-400 border-rose-500/25',
  'No New Data':'bg-slate-500/15 text-slate-400 border-slate-500/25',
}[s]??'bg-slate-500/15 text-slate-400 border-slate-500/25');
const methodIcon = m => ({ RFID:'📡', PIN:'🔢', Biometric:'🫆', Manual:'🔑' }[m]??'🔒');
const meterIcon  = m => ({ Electricity:'⚡', Solar:'☀️', Water:'💧', Gas:'🔥' }[m]??'📊');

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const TT = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:'#0A1628', border:'1px solid #1E293B', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'#94A3B8', fontWeight:700, marginBottom:4 }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ color:p.color||'#fff', fontWeight:700 }}>{p.name}: {typeof p.value==='number'?fmt(p.value,2):p.value}</p>
      ))}
    </div>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ title, badge, icon:Icon, children, className='', noPad=false, accent }) {
  return (
    <div className={`rounded-2xl border bg-[#0A1628] transition-all duration-200 hover:border-slate-700/80 ${noPad?'':'p-5'} ${className}`}
      style={{ borderColor: accent ? accent+'30' : '#1E293B', boxShadow: accent ? `0 0 0 1px ${accent}10` : 'none' }}>
      <div className={`flex items-center justify-between ${noPad?'p-5 pb-0':'mb-4'}`}>
        <div className="flex items-center gap-2">
          {Icon && <div className="p-1.5 rounded-lg" style={{ background:'#1E293B80' }}><Icon size={13} style={{ color:'#94A3B8' }} /></div>}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        {badge && (
          <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ color:'#475569', background:'#1E293B80', border:'1px solid #334155' }}>{badge}</span>
        )}
      </div>
      {noPad ? <div className="p-5 pt-4">{children}</div> : children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon:Icon, title, value, sub, color, trend, trendUp }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 group cursor-default"
      style={{ background:'#0A1628', border:'1px solid #1E293B' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 truncate" style={{ color:'#475569' }}>{title}</p>
          <p className="text-3xl font-black text-white leading-none tabular-nums">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {trendUp ? <ArrowUpRight size={11} style={{ color:C.emerald }} /> : <ArrowDownRight size={11} style={{ color:C.rose }} />}
              <span className="text-[10px] font-bold" style={{ color: trendUp ? C.emerald : C.rose }}>{trend}</span>
            </div>
          )}
          {sub && !trend && (
            <p className="text-[10px] mt-2 flex items-center gap-1.5 truncate" style={{ color:'#334155' }}>
              <CheckCircle2 size={10} style={{ color:C.emerald, flexShrink:0 }} />
              <span className="truncate">{sub}</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
          style={{ background:color+'18', color }}>
          <Icon size={20} />
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-500" style={{ color }}>
        <Icon size={88} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusCls(status)}`}>{status}</span>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-1">
      <h2 className="text-base font-black text-white">{title}</h2>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Campus Health Score Gauge ────────────────────────────────────────────────
function HealthGauge({ score=82 }) {
  const gaugeData = [{ name:'score', value:score, fill:score>80?C.emerald:score>60?C.amber:C.rose }];
  const bgData    = [{ name:'bg',    value:100,   fill:'#1E293B' }];
  return (
    <div style={{ position:'relative', height:130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="65%" outerRadius="85%" startAngle={200} endAngle={-20} data={bgData} barSize={14}>
          <RadialBar dataKey="value" cornerRadius={8} background={false}/>
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position:'absolute', inset:0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="65%" outerRadius="85%" startAngle={200} endAngle={200-(score/100)*220} data={gaugeData} barSize={14}>
            <RadialBar dataKey="value" cornerRadius={8} background={false}/>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:12 }}>
        <span style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:4 }}>Health Score</span>
      </div>
    </div>
  );
}

// ─── Energy Mini Heatmap ──────────────────────────────────────────────────────
function EnergyHeatmap({ roomEnergy }) {
  const hours = [8,9,10,11,12,13,14,15,16,17,18];
  const rooms = (roomEnergy ?? MOCK.room_energy).slice(0,6);
  // Simulate per-room, per-hour kWh using a sine-like pattern
  const getCellKwh = (roomIdx, hour) => {
    const base = rooms[roomIdx]?.avg_kwh_per_hour ?? 3;
    const factor = hour < 9 ? 0.5 : hour < 12 ? 1.1 : hour === 12 ? 0.6 : hour < 17 ? 1.0 : 0.7;
    return +(base * factor * (0.85 + Math.sin(roomIdx + hour) * 0.15)).toFixed(2);
  };
  const allVals = rooms.flatMap((_,ri) => hours.map(h => getCellKwh(ri,h)));
  const maxVal  = Math.max(...allVals);
  const getColor = (val) => {
    const t = val / maxVal;
    if (t > 0.8) return '#F43F5E';
    if (t > 0.6) return '#F97316';
    if (t > 0.4) return '#F59E0B';
    if (t > 0.2) return '#10B981';
    return '#06B6D4';
  };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
        <span style={{ fontSize:9, color:'#475569', fontWeight:700, width:70, flexShrink:0 }}>Room \ Hour</span>
        {hours.map(h=>(
          <span key={h} style={{ flex:1, textAlign:'center', fontSize:8, color:'#334155', fontWeight:700 }}>{h}h</span>
        ))}
      </div>
      {rooms.map((r,ri)=>(
        <div key={ri} style={{ display:'flex', alignItems:'center', gap:4, marginBottom:3 }}>
          <span style={{ fontSize:9, color:'#94A3B8', fontWeight:700, width:70, flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.room_no}</span>
          {hours.map(h=>{
            const val = getCellKwh(ri,h);
            const col = getColor(val);
            return (
              <div key={h} title={`${r.room_no} @ ${h}:00 → ${val} kWh`}
                style={{ flex:1, height:20, borderRadius:3, background:col+'35', border:`1px solid ${col}50`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:7, fontWeight:900, color:col }}>{val}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
        <span style={{ fontSize:9, color:'#475569', fontWeight:700 }}>Low →</span>
        {['#06B6D4','#10B981','#F59E0B','#F97316','#F43F5E'].map(c=>(
          <span key={c} style={{ width:16, height:8, borderRadius:2, background:c+'50', border:`1px solid ${c}80`, display:'inline-block' }}/>
        ))}
        <span style={{ fontSize:9, color:'#475569', fontWeight:700 }}>→ High</span>
      </div>
    </div>
  );
}

// ─── Star Schema SVG Diagram ──────────────────────────────────────────────────
function StarSchemaDiagram() {
  const W=700, H=420, CX=350, CY=210;
  const factW=200, factH=170, dimW=160, dimH=120;
  const dims = [
    { id:'date',  label:'dim_date',    x:350, y:40,  color:C.blue,   keys:['date_key PK','full_date','day_name','month_no','quarter','year','is_weekend'] },
    { id:'room',  label:'dim_room',    x:590, y:180, color:C.violet, keys:['room_key PK','room_id','room_no','room_type','capacity','floor_label','building_name','dept_name'] },
    { id:'meter', label:'dim_meter',   x:350, y:360, color:C.teal,   keys:['meter_key PK','meter_id','meter_type','room_no'] },
    { id:'dept',  label:'dim_department',x:110, y:180,color:C.emerald,keys:['dept_key PK','dept_id','dept_name','office_location'] },
  ];
  const factFields = ['fact_id PK','date_key FK','room_key FK','meter_key FK','kwh_consumed','voltage','peak_flag','cost_inr'];

  const lineCoords = (dim) => {
    const fx = CX, fy = CY;
    return { x1:fx, y1:fy, x2:dim.x, y2:dim.y };
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:'auto', maxHeight:320 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="#334155"/>
        </marker>
        {dims.map(d=>(
          <filter key={d.id} id={`glow-${d.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        ))}
      </defs>

      {/* Connection lines */}
      {dims.map(d=>{
        const l = lineCoords(d);
        return (
          <line key={d.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#1E293B" strokeWidth="1.5" strokeDasharray="5,4"
            markerEnd="url(#arrow)"/>
        );
      })}

      {/* Fact table - center */}
      <rect x={CX-factW/2} y={CY-factH/2} width={factW} height={factH}
        rx="10" fill={C.amber+'08'} stroke={C.amber} strokeWidth="1.5"/>
      <rect x={CX-factW/2} y={CY-factH/2} width={factW} height={22} rx="10" fill={C.amber+'25'} style={{clipPath:'inset(0 0 -10px 0)'}}/>
      <text x={CX} y={CY-factH/2+15} textAnchor="middle" fill={C.amber} fontSize="9" fontWeight="900" letterSpacing="1" fontFamily="monospace">FACT TABLE</text>
      <text x={CX} y={CY-factH/2+30} textAnchor="middle" fill="#F1F5F9" fontSize="10" fontWeight="800" fontFamily="monospace">fact_energy_consumption</text>
      {factFields.map((f,i)=>(
        <text key={i} x={CX-factW/2+10} y={CY-factH/2+48+i*14} fill={f.includes('FK')?C.blue:f.includes('PK')?C.amber:'#64748B'} fontSize="8.5" fontFamily="monospace">{f}</text>
      ))}

      {/* Dimension tables */}
      {dims.map(d=>(
        <g key={d.id}>
          <rect x={d.x-dimW/2} y={d.y-dimH/2} width={dimW} height={dimH}
            rx="8" fill={d.color+'08'} stroke={d.color} strokeWidth="1"/>
          <rect x={d.x-dimW/2} y={d.y-dimH/2} width={dimW} height={18} rx="8" fill={d.color+'20'} style={{clipPath:'inset(0 0 -8px 0)'}}/>
          <text x={d.x} y={d.y-dimH/2+12} textAnchor="middle" fill={d.color} fontSize="8" fontWeight="900" letterSpacing="0.8" fontFamily="monospace">DIMENSION</text>
          <text x={d.x} y={d.y-dimH/2+28} textAnchor="middle" fill="#E2E8F0" fontSize="9" fontWeight="700" fontFamily="monospace">{d.label}</text>
          {d.keys.slice(0,5).map((k,i)=>(
            <text key={i} x={d.x-dimW/2+8} y={d.y-dimH/2+42+i*13} fill={k.includes('PK')?d.color:'#475569'} fontSize="7.5" fontFamily="monospace">{k}</text>
          ))}
          {d.keys.length>5 && <text x={d.x-dimW/2+8} y={d.y-dimH/2+42+5*13} fill="#334155" fontSize="7" fontFamily="monospace">+{d.keys.length-5} more...</text>}
        </g>
      ))}

      {/* Labels */}
      <text x={CX} y={H-6} textAnchor="middle" fill="#334155" fontSize="9" fontWeight="700">Star Schema — SmartCampusDB Data Warehouse</text>
    </svg>
  );
}

// ─── ETL Pipeline Visual ──────────────────────────────────────────────────────
function ETLPipelineVisual() {
  const steps = [
    { label:'OLTP Source',     sub:'ENERGY_READING\n(SQL Server)',  icon:HardDrive, color:C.blue,    detail:'~150 rows/day' },
    { label:'Watermark Check', sub:'Incremental\nLoad Detection',   icon:Clock,     color:C.indigo,  detail:'Avoids duplicates' },
    { label:'IQR Cleaning',    sub:'Outlier Detection\n& Imputation',icon:FlaskConical,color:C.violet,detail:'Q1-1.5×IQR, Q3+1.5×IQR' },
    { label:'Transform',       sub:'Surrogate Key\nMapping',        icon:GitBranch, color:C.cyan,    detail:'dim_room, dim_meter' },
    { label:'Warehouse Load',  sub:'fact_energy_\nconsumption',     icon:Database,  color:C.emerald, detail:'Star Schema' },
  ];
  return (
    <div style={{ display:'flex', alignItems:'stretch', gap:0, overflowX:'auto', paddingBottom:4 }}>
      {steps.map((s,i)=>(
        <React.Fragment key={i}>
          <div style={{ flexShrink:0, textAlign:'center', minWidth:120 }}>
            <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 8px',
              display:'flex', alignItems:'center', justifyContent:'center',
              background:s.color+'18', border:`1.5px solid ${s.color}40` }}>
              <s.icon size={22} style={{ color:s.color }}/>
            </div>
            <p style={{ fontSize:10, fontWeight:900, color:'#F1F5F9', lineHeight:1.3 }}>{s.label}</p>
            <p style={{ fontSize:8.5, color:'#475569', marginTop:3, lineHeight:1.4, whiteSpace:'pre-line' }}>{s.sub}</p>
            <p style={{ fontSize:8, color:s.color, marginTop:4, fontWeight:700 }}>{s.detail}</p>
          </div>
          {i < steps.length-1 && (
            <div style={{ display:'flex', alignItems:'center', padding:'0 4px', flexShrink:0 }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <div style={{ width:28, height:1.5, background:'#1E293B', position:'relative' }}>
                  <div style={{ position:'absolute', right:0, top:-3, width:0, height:0,
                    borderLeft:`6px solid #334155`, borderTop:'4px solid transparent', borderBottom:'4px solid transparent' }}/>
                </div>
                <span style={{ fontSize:7, color:'#334155', fontWeight:700, fontFamily:'monospace' }}>→</span>
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 1 — OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
function OverviewPage({ data }) {
  const kpis       = data?.kpis         ?? MOCK.kpis;
  const buildings  = data?.buildings    ?? MOCK.buildings;
  const peakRatio  = data?.peak_ratio   ?? MOCK.peak_ratio;
  const hourly     = data?.hourly_trend ?? MOCK.hourly_trend;
  const roles      = data?.user_roles   ?? MOCK.user_roles;
  const meterTypes = data?.meter_types  ?? MOCK.meter_types;
  const weekly     = MOCK.weekly_trend;
  const solarData  = MOCK.solar_vs_electric;

  const totalPeak = peakRatio.find(r=>r.peak_flag===1||r.peak_flag===true)?.count??0;
  const totalOff  = peakRatio.find(r=>r.peak_flag===0||r.peak_flag===false)?.count??0;
  const peakPct   = totalPeak+totalOff>0 ? Math.round((totalPeak/(totalPeak+totalOff))*100) : 0;

  const totalSolar    = solarData.reduce((a,d)=>a+d.solar,0);
  const totalElectric = solarData.reduce((a,d)=>a+d.electric,0);
  const solarPct      = Math.round((totalSolar/(totalSolar+totalElectric))*100);

  const kpiRows = [
    [
      { icon:Activity,  title:'Total Energy',   value:`${fmt(kpis.energy)} MWh`, color:C.amber,   trend:'+4.2% vs last month', trendUp:false },
      { icon:Users,     title:'Campus Users',   value:fmtK(kpis.users),          color:C.blue,    trend:'+8 new this month',   trendUp:true  },
      { icon:Building2, title:'Rooms Tracked',  value:kpis.rooms,                color:C.emerald, sub:'16 active rooms'                       },
      { icon:Calendar,  title:'Total Bookings', value:fmtK(kpis.bookings),       color:C.violet,  trend:'+32 this week',       trendUp:true  },
    ],
    [
      { icon:Wrench,  title:'Open Tickets',   value:kpis.tickets??18,    color:C.rose                              },
      { icon:Shield,  title:'Access Events',  value:fmtK(kpis.access_logs), color:C.cyan, sub:'Total access logs' },
      { icon:Cpu,     title:'Active Equip.',  value:kpis.equipment??65,  color:C.teal,                             },
      { icon:Zap,     title:'Active Meters',  value:kpis.meters??27,     color:C.orange, sub:'Across all buildings'},
    ],
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiRows[0].map((k,i)=><KpiCard key={i} {...k}/>)}
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiRows[1].map((k,i)=><KpiCard key={i} {...k}/>)}
      </div>

      {/* Campus Health + Hourly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Campus Health Score" badge="Live Score" icon={Target} accent={C.emerald}>
          <HealthGauge score={82}/>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label:'Energy Eff.', score:78, color:C.amber  },
              { label:'Maintenance', score:69, color:C.rose   },
              { label:'Space Util.', score:85, color:C.emerald},
            ].map((s,i)=>(
              <div key={i} className="p-2 rounded-xl text-center" style={{ background:s.color+'10', border:`1px solid ${s.color}20` }}>
                <p className="text-lg font-black text-white">{s.score}</p>
                <p className="text-[8px] uppercase tracking-wider font-bold" style={{ color:s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2" title="Energy + Booking Weekly Trend" badge="Dual Axis" icon={TrendingUp}>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weekly} margin={{ top:4, right:24, left:-16, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="week" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="l" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="r" orientation="right" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{ fontSize:10, color:'#94A3B8', paddingTop:6 }}/>
                <Bar yAxisId="l" dataKey="kwh" name="Energy kWh" fill={C.amber} opacity={0.7} radius={[4,4,0,0]} barSize={16}/>
                <Line yAxisId="r" type="monotone" dataKey="bookings" name="Bookings" stroke={C.blue} strokeWidth={2.5} dot={{ fill:C.blue, r:3 }}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Solar vs Grid + Buildings + Meter types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Solar vs Grid Consumption" badge="6 Months" icon={Sun} accent={C.amber}>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={solarData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.amber} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="month" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="electric" name="Grid kWh" stroke={C.blue}  strokeWidth={2} fill="url(#sg2)"/>
                <Area type="monotone" dataKey="solar"    name="Solar kWh" stroke={C.amber} strokeWidth={2} fill="url(#sg1)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-3 p-3 rounded-xl" style={{ background:C.amber+'10', border:`1px solid ${C.amber}20` }}>
            <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>Solar Coverage</span>
            <span className="text-lg font-black" style={{ color:C.amber }}>{solarPct}%</span>
          </div>
        </Card>

        <Card title="Building Energy Roll-Up" badge="Warehouse" icon={Building2}>
          <div className="space-y-3">
            {buildings.map((b,i)=>{
              const pct = (b.total / buildings.reduce((a,x)=>a+x.total,0)*100).toFixed(0);
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background:'#1E293B40' }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-white">{b.building_name}</span>
                    <span className="text-xs font-black" style={{ color:C.chart[i] }}>{b.total.toLocaleString()} kWh</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'#0F172A' }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:C.chart[i] }}/>
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px]" style={{ color:'#334155' }}>{b.rooms_monitored} rooms · Peak: {b.peak_kwh} kWh</span>
                    <span className="text-[9px] font-bold" style={{ color:C.chart[i] }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-xl flex justify-between" style={{ background:'#1E293B40' }}>
            <span className="text-[10px] text-slate-400">Peak Ratio</span>
            <span className="text-sm font-black" style={{ color:C.rose }}>{peakPct}% peak hours</span>
          </div>
        </Card>

        <Card title="Meter Type Distribution" badge="Infrastructure" icon={Radio}>
          <div style={{ height:140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={meterTypes} innerRadius={42} outerRadius={62} paddingAngle={5} dataKey="count" nameKey="meter_type" stroke="none">
                  {meterTypes.map((_,i)=><Cell key={i} fill={C.chart[i]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {meterTypes.map((m,i)=>(
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background:'#1E293B40' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background:C.chart[i] }}/>
                  <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>{meterIcon(m.meter_type)} {m.meter_type}</span>
                </div>
                <span className="text-xs font-black text-white">{m.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly energy + User roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="24-Hour Energy Profile" badge="Hourly OLTP" icon={Activity}>
          <div style={{ height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.5}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="hour" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}
                  tickFormatter={h=>`${h}h`}/>
                <YAxis tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="avg_kwh" name="Avg kWh" stroke={C.blue} strokeWidth={2} fill="url(#hg)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="User Role Distribution" badge="Stakeholder Mix" icon={Users}>
          <div className="flex gap-5">
            <div style={{ flex:1, height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roles} innerRadius={50} outerRadius={72} paddingAngle={5} dataKey="value" nameKey="label" stroke="none">
                    {roles.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-2 flex-1">
              {roles.map((r,i)=>(
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background:C.chart[i]+'12', border:`1px solid ${C.chart[i]}20` }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:C.chart[i%C.chart.length] }}/>
                  <span className="text-xs font-bold flex-1" style={{ color:'#94A3B8' }}>{r.label}</span>
                  <span className="text-sm font-black text-white">{r.value}</span>
                  <span className="text-[9px]" style={{ color:C.chart[i] }}>
                    {Math.round((r.value/roles.reduce((a,x)=>a+x.value,0))*100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 2 — ENERGY ANALYSIS
// ════════════════════════════════════════════════════════════════════════════
function EnergyPage({ data }) {
  const roomEnergy = data?.room_energy      ?? MOCK.room_energy;
  const deptEnergy = data?.dept_energy      ?? MOCK.dept_energy;
  const anomalies  = data?.anomaly_readings ?? MOCK.anomaly_readings;
  const eqStatus   = data?.equipment_status ?? MOCK.equipment_status;
  const kpis       = data?.kpis             ?? MOCK.kpis;

  const totalKwh   = roomEnergy.reduce((a,r)=>a+r.total_kwh,0);
  const estCost    = totalKwh * 8.5;
  const estCarbon  = totalKwh * 0.82;
  const avgVoltage = 228.4;

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon:Zap,         label:'Total kWh',        val:`${fmt(totalKwh,0)} kWh`,     color:C.amber   },
          { icon:DollarSign,  label:'Est. Cost (₹8.5)', val:`₹${(estCost/1000).toFixed(1)}K`, color:C.emerald },
          { icon:Leaf,        label:'CO₂ Footprint',    val:`${fmt(estCarbon,0)} kg`,      color:C.teal    },
          { icon:Thermometer, label:'Avg Voltage',      val:`${avgVoltage} V`,             color:C.blue    },
        ].map((s,i)=>(
          <div key={i} className="flex items-center gap-4 p-5 rounded-2xl" style={{ background:'#0A1628', border:'1px solid #1E293B' }}>
            <div className="p-3 rounded-xl flex-shrink-0" style={{ background:s.color+'18', color:s.color }}><s.icon size={20}/></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color:'#475569' }}>{s.label}</p>
              <p className="text-xl font-black text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room breakdown */}
        <Card title="Room-Level Energy Breakdown" badge="Drill-Down" icon={Activity}>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {roomEnergy.map((r,i)=>{
              const pct = Math.min(100,(r.total_kwh/(roomEnergy[0]?.total_kwh||1))*100);
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background:'#1E293B30' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-black text-white">{r.room_no}</span>
                      <span className="ml-2 text-[9px] uppercase tracking-wider" style={{ color:'#475569' }}>{r.room_type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-white">{fmt(r.total_kwh,0)} kWh</span>
                      <span className="ml-2 text-[9px]" style={{ color:C.amber }}>↑ {fmt(r.peak_kwh,0)} peak</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:C.chart[i%C.chart.length] }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color:'#334155' }}>avg {fmt(r.avg_kwh_per_hour,1)} kWh/hr</span>
                    <span className="text-[9px] font-bold" style={{ color:C.chart[i%C.chart.length] }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Dept rollup */}
        <Card title="Department Energy Roll-Up" badge="OLAP Roll-Up" icon={BarChart2}>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptEnergy} layout="vertical" margin={{ top:0, right:16, left:8, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B"/>
                <XAxis type="number" tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis dataKey="dept_name" type="category" width={72} tick={{ fill:'#94A3B8', fontSize:10, fontWeight:700 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="total_kwh" name="Total kWh" radius={[0,6,6,0]} barSize={32}>
                  {deptEnergy.map((_,i)=><Cell key={i} fill={C.chart[i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {deptEnergy.map((d,i)=>(
              <div key={i} className="p-2.5 rounded-xl text-center" style={{ background:C.chart[i]+'10', border:`1px solid ${C.chart[i]}20` }}>
                <p className="text-sm font-black text-white">{fmt(d.total_kwh,0)}</p>
                <p className="text-[8px] font-bold uppercase" style={{ color:C.chart[i] }}>kWh</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Energy Heatmap */}
      <Card title="Room × Hour Energy Heatmap" badge="IQ Matrix" icon={Gauge} accent={C.blue}>
        <p className="text-[10px] mb-4" style={{ color:'#475569' }}>Average kWh consumed per room per hour (8AM–6PM) — darker = higher consumption</p>
        <EnergyHeatmap roomEnergy={roomEnergy}/>
      </Card>

      {/* Solar vs Electric trend + CO2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Solar vs Grid Energy — Monthly" badge="Renewable Mix" icon={Sun} accent={C.amber}>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK.solar_vs_electric} margin={{ top:4, right:8, left:-16, bottom:0 }} barGap={3} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="month" tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{ fontSize:10, color:'#94A3B8', paddingTop:4 }}/>
                <Bar dataKey="electric" name="Grid kWh" fill={C.blue}  radius={[4,4,0,0]} barSize={18}/>
                <Bar dataKey="solar"    name="Solar kWh" fill={C.amber} radius={[4,4,0,0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 rounded-xl mt-2 flex items-center justify-between"
            style={{ background:C.amber+'10', border:`1px solid ${C.amber}20` }}>
            <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>6-Month Solar Generation</span>
            <span className="text-sm font-black" style={{ color:C.amber }}>
              {fmt(MOCK.solar_vs_electric.reduce((a,d)=>a+d.solar,0),0)} kWh
            </span>
          </div>
        </Card>

        <Card title="CO₂ Footprint Trend" badge="Sustainability" icon={Leaf} accent={C.teal}>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK.co2_trend} margin={{ top:4, right:8, left:-16, bottom:0 }}>
                <defs>
                  <linearGradient id="co2g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="month" tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Area type="monotone" dataKey="kg" name="CO₂ (kg)" stroke={C.teal} strokeWidth={2} fill="url(#co2g)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-3 rounded-xl text-center" style={{ background:C.teal+'10', border:`1px solid ${C.teal}20` }}>
              <p className="text-lg font-black text-white">{fmt(MOCK.co2_trend.reduce((a,d)=>a+d.kg,0),0)}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color:C.teal }}>Total kg CO₂</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background:C.emerald+'10', border:`1px solid ${C.emerald}20` }}>
              <p className="text-lg font-black text-white">-12%</p>
              <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color:C.emerald }}>vs Last Year</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Anomaly + Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Anomaly Detection — LAG Window Analysis" badge="SQL Window Fn" icon={AlertTriangle} accent={C.rose}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom:'1px solid #1E293B' }}>
                  {['Meter','Timestamp','kWh','Δ kWh','Status'].map(h=>(
                    <th key={h} className="pb-2 text-left text-[10px] font-black uppercase tracking-wider pr-3 last:text-right" style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalies.map((a,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #1E293B40' }} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-2.5 pr-3 font-bold" style={{ color:'#CBD5E1' }}>M-{a.meter_id}</td>
                    <td className="py-2.5 pr-3 font-mono" style={{ color:'#475569' }}>{a.timestamp.split(' ')[1]}</td>
                    <td className="py-2.5 pr-3 text-right font-mono font-black text-white">{fmt(a.kwh_consumed)}</td>
                    <td className="py-2.5 pr-3 text-right font-mono font-black"
                      style={{ color:a.delta_kwh>2?C.rose:a.delta_kwh>0?C.amber:C.emerald }}>
                      {a.delta_kwh!=null?`${a.delta_kwh>0?'+':''}${fmt(a.delta_kwh)}`:'—'}
                    </td>
                    <td className="py-2.5 text-right"><StatusBadge status={a.anomaly_flag==='SPIKE DETECTED'?'SPIKE DETECTED':'Normal'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 rounded-xl flex items-center gap-3" style={{ background:C.rose+'10', border:`1px solid ${C.rose}20` }}>
            <AlertTriangle size={14} style={{ color:C.rose, flexShrink:0 }}/>
            <div>
              <p className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>
                {anomalies.filter(a=>a.anomaly_flag==='SPIKE DETECTED').length} spike(s) via <span className="font-mono" style={{ color:C.rose }}>LAG()</span> window function
              </p>
              <p className="text-[9px] font-mono mt-0.5" style={{ color:'#334155' }}>
                CASE WHEN kwh - LAG(kwh) OVER (PARTITION BY meter_id ORDER BY ts) {'>'} 2 THEN 'SPIKE'
              </p>
            </div>
          </div>
        </Card>

        <Card title="Equipment Status & Asset Registry" badge="Asset Analytics" icon={Cpu}>
          <div style={{ height:160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={eqStatus} innerRadius={48} outerRadius={68} paddingAngle={5} dataKey="count" nameKey="status" stroke="none">
                  {eqStatus.map((_,i)=><Cell key={i} fill={[C.emerald,C.slate,C.rose][i%3]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {eqStatus.map((e,i)=>(
              <div key={i} className="p-3 rounded-xl text-center"
                style={{ background:[C.emerald,C.slate,C.rose][i%3]+'10', border:`1px solid ${[C.emerald,C.slate,C.rose][i%3]}20` }}>
                <p className="text-2xl font-black text-white">{e.count}</p>
                <p className="text-[9px] font-bold uppercase mt-1" style={{ color:[C.emerald,C.slate,C.rose][i%3] }}>{e.status}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color:'#475569' }}>Equipment By Type</p>
            <div style={{ height:100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK.equip_by_type} margin={{ top:0, right:0, left:-20, bottom:0 }}>
                  <XAxis dataKey="type" tick={{ fill:'#475569', fontSize:8 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="count" name="Count" radius={[3,3,0,0]} barSize={12}>
                    {MOCK.equip_by_type.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 3 — INFRASTRUCTURE
// ════════════════════════════════════════════════════════════════════════════
function InfraPage({ data }) {
  const buildings = [
    { name:'PI Block', type:'Admin + Research', floors:3, rooms:4,  year:2019, util:68, color:C.blue   },
    { name:'E Block',  type:'Academic',         floors:5, rooms:16, year:2019, util:91, color:C.violet },
    { name:'M Block',  type:'Sports Complex',   floors:2, rooms:2,  year:2020, util:42, color:C.emerald},
    { name:'B Block',  type:'Boys Hostel',       floors:4, rooms:8,  year:2020, util:78, color:C.amber  },
    { name:'G Block',  type:'Girls Hostel',      floors:4, rooms:8,  year:2020, util:74, color:C.teal   },
    { name:'H Block',  type:'Gym + Canteen',     floors:2, rooms:4,  year:2021, util:55, color:C.orange },
  ];
  const roomTypes   = MOCK.room_type_dist;
  const equipTypes  = MOCK.equip_by_type;
  const totalPower  = 165;

  return (
    <div className="space-y-6">
      {/* Building cards */}
      <div>
        <SectionHeader title="Campus Buildings" sub="Physical infrastructure nodes across IIIT Dharwad — utilization = bookings / capacity"/>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
          {buildings.map((b,i)=>(
            <div key={i} className="p-4 rounded-2xl group hover:scale-105 transition-all duration-200 cursor-default"
              style={{ background:'#0A1628', border:`1px solid ${b.color}30` }}>
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl"
                style={{ background:b.color+'15' }}>🏢</div>
              <p className="text-xs font-black text-white">{b.name}</p>
              <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color:b.color }}>{b.type}</p>
              <div className="mt-3 space-y-1.5">
                {[['Floors',b.floors],['Rooms',b.rooms],['Built',b.year]].map(([k,v])=>(
                  <div key={k} className="flex justify-between text-[10px]">
                    <span style={{ color:'#475569' }}>{k}</span>
                    <span className="font-black text-white">{v}</span>
                  </div>
                ))}
                <div className="mt-2">
                  <div className="flex justify-between text-[9px] mb-1">
                    <span style={{ color:'#475569' }}>Utilization</span>
                    <span className="font-bold" style={{ color:b.util>80?C.rose:b.util>60?C.amber:C.emerald }}>{b.util}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
                    <div className="h-full rounded-full" style={{ width:`${b.util}%`, background:b.util>80?C.rose:b.util>60?C.amber:C.emerald }}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room type dist */}
        <Card title="Room Type Distribution" badge="Infrastructure" icon={Map}>
          <div className="grid grid-cols-2 gap-3">
            {roomTypes.map((r,i)=>(
              <div key={i} className="p-4 rounded-xl flex items-center gap-3"
                style={{ background:C.chart[i]+'12', border:`1px solid ${C.chart[i]}25` }}>
                <div className="p-2.5 rounded-lg" style={{ background:C.chart[i]+'20' }}>
                  {i===0?<MonitorCheck size={18} style={{ color:C.chart[i] }}/>
                  :i===1?<BookOpen size={18} style={{ color:C.chart[i] }}/>
                  :i===2?<CircuitBoard size={18} style={{ color:C.chart[i] }}/>
                  :<Layers size={18} style={{ color:C.chart[i] }}/>}
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{r.count}</p>
                  <p className="text-[10px] font-bold" style={{ color:C.chart[i] }}>{r.type}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-xl flex justify-between items-center"
            style={{ background:'#1E293B40', border:'1px solid #1E293B' }}>
            <span className="text-xs font-bold" style={{ color:'#94A3B8' }}>Total Monitored Rooms</span>
            <span className="text-2xl font-black text-white">16</span>
          </div>
        </Card>

        <Card title="Room Capacity Overview" badge="Space Planning" icon={Users}>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { room:'Seminar Hall', cap:240 }, { room:'Mini Sem.', cap:120 },
                { room:'Classrooms',  cap:60  }, { room:'Labs',      cap:50  },
              ]} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="room" tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="cap" name="Capacity (seats)" radius={[6,6,0,0]}>
                  {['#3B82F6','#8B5CF6','#10B981','#F59E0B'].map((c,i)=><Cell key={i} fill={c}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label:'Total Capacity', val:'1,860 seats', color:C.blue   },
              { label:'Avg per Room',   val:'116 seats',   color:C.violet },
              { label:'Largest Room',   val:'240 seats',   color:C.emerald},
            ].map((s,i)=>(
              <div key={i} className="p-3 rounded-xl text-center" style={{ background:'#1E293B40' }}>
                <p className="text-xs font-black text-white">{s.val}</p>
                <p className="text-[9px] uppercase tracking-wider mt-1" style={{ color:s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Equipment analytics */}
      <Card title="Equipment Analytics — Power Capacity & Type Distribution" badge="Asset Registry" icon={Cpu}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color:'#475569' }}>Equipment by Type</p>
            <div style={{ height:200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipTypes} layout="vertical" margin={{ top:0, right:16, left:8, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1E293B"/>
                  <XAxis type="number" tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis dataKey="type" type="category" width={72} tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="count" name="Count" radius={[0,5,5,0]} barSize={14}>
                    {equipTypes.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color:'#475569' }}>Installed Power Capacity</p>
            {[
              { type:'Air Conditioners', count:12, kw:3.5, color:C.blue    },
              { type:'GPU Servers',      count:8,  kw:3.0, color:C.violet  },
              { type:'Solar Inverters',  count:15, kw:5.0, color:C.amber   },
              { type:'Projectors',       count:10, kw:0.5, color:C.emerald },
              { type:'Desktop PCs',      count:18, kw:0.35,color:C.cyan    },
            ].map((e,i)=>(
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background:'#1E293B30' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:e.color }}/>
                <span className="text-xs font-bold flex-1" style={{ color:'#CBD5E1' }}>{e.type}</span>
                <span className="text-[10px]" style={{ color:'#475569' }}>{e.count} units</span>
                <span className="text-xs font-black" style={{ color:e.color }}>{(e.count*e.kw).toFixed(1)} kW</span>
              </div>
            ))}
            <div className="p-3 rounded-xl flex justify-between items-center"
              style={{ background:C.amber+'10', border:`1px solid ${C.amber}20` }}>
              <span className="text-xs font-bold" style={{ color:'#94A3B8' }}>Total Installed Capacity</span>
              <span className="text-lg font-black" style={{ color:C.amber }}>{totalPower} kW</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Network topology summary */}
      <Card title="Network & IoT Node Summary" badge="Smart Sensors" icon={Network}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Energy Meters',  val:27, sub:'Electricity + Solar + Gas', color:C.amber,   icon:Zap  },
            { label:'Access Readers', val:16, sub:'RFID + Biometric + PIN',    color:C.blue,    icon:Shield },
            { label:'HVAC Sensors',   val:12, sub:'Temperature + Humidity',    color:C.cyan,    icon:Wind },
            { label:'IP Cameras',     val:24, sub:'Campus surveillance',       color:C.violet,  icon:Eye  },
          ].map((n,i)=>(
            <div key={i} className="p-4 rounded-2xl" style={{ background:n.color+'10', border:`1px solid ${n.color}25` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg" style={{ background:n.color+'20' }}>
                  <n.icon size={16} style={{ color:n.color }}/>
                </div>
                <span className="w-2 h-2 rounded-full" style={{ background:C.emerald, boxShadow:`0 0 6px ${C.emerald}` }}/>
              </div>
              <p className="text-2xl font-black text-white">{n.val}</p>
              <p className="text-[10px] font-black uppercase tracking-wider mt-1" style={{ color:n.color }}>{n.label}</p>
              <p className="text-[9px] mt-1" style={{ color:'#475569' }}>{n.sub}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 4 — BOOKINGS
// ════════════════════════════════════════════════════════════════════════════
function BookingsPage({ data }) {
  const bookingStatus = data?.booking_status ?? MOCK.booking_status;

  const bookings = [
    { id:1,  by:'Dr Rao',      dept:'CSE', room:'C101', purpose:'DBMS Lecture',        status:'Approved',  time:'08:00–09:00', date:'Apr 7'  },
    { id:2,  by:'Dr Sharma',   dept:'ECE', room:'C201', purpose:'Signals Class',        status:'Approved',  time:'09:00–10:00', date:'Apr 7'  },
    { id:3,  by:'Dr Mehta',    dept:'DSAI',room:'L201', purpose:'ML Lab',               status:'Approved',  time:'10:00–11:00', date:'Apr 7'  },
    { id:4,  by:'Arjun Kumar', dept:'CSE', room:'Sem.', purpose:'Project Review',       status:'Pending',   time:'14:00–16:00', date:'Apr 8'  },
    { id:5,  by:'Dr Rao',      dept:'CSE', room:'C202', purpose:'DSA Lecture',          status:'Approved',  time:'11:00–13:00', date:'Apr 8'  },
    { id:6,  by:'Dr Sharma',   dept:'ECE', room:'L101', purpose:'ECE Lab Practice',     status:'Approved',  time:'15:00–17:00', date:'Apr 9'  },
    { id:7,  by:'Dr Mehta',    dept:'DSAI',room:'Sem.', purpose:'Seminar Presentation', status:'Approved',  time:'09:00–11:00', date:'Apr 9'  },
    { id:8,  by:'Priya Singh', dept:'CSE', room:'Mini', purpose:'Group Study',          status:'Cancelled', time:'10:00–12:00', date:'Apr 10' },
    { id:9,  by:'Rahul Patil', dept:'ECE', room:'Mini', purpose:'Workshop',             status:'Rejected',  time:'10:00–12:00', date:'Apr 10' },
    { id:10, by:'Dr Rao',      dept:'CSE', room:'C101', purpose:'Morning Briefing',     status:'Completed', time:'08:00–09:00', date:'Apr 11' },
    { id:11, by:'Gopal Gupta', dept:'DSAI',room:'L301', purpose:'Data Science Lab',     status:'Completed', time:'10:00–11:00', date:'Apr 7'  },
    { id:12, by:'Neha Verma',  dept:'CSE', room:'C104', purpose:'Hackathon Prep',       status:'Approved',  time:'08:00–09:00', date:'Apr 9'  },
  ];

  const counts = bookings.reduce((acc,b)=>{ acc[b.status]=(acc[b.status]||0)+1; return acc; },{});
  const pieData = Object.entries(counts).map(([name,value])=>({ name, value }));
  const pieColors = { Approved:C.emerald, Pending:C.amber, Cancelled:C.slate, Rejected:C.rose, Completed:C.blue };

  const utilization = bookingStatus.map(r=>({
    ...r, util_rate: r.total_bookings > 0 ? Math.round((r.approved/r.total_bookings)*100) : 0,
  }));

  const approvalRate = Math.round(((counts.Approved||0)+(counts.Completed||0)) / bookings.length * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {['Approved','Pending','Cancelled','Rejected','Completed'].map((s,i)=>(
          <div key={i} className="p-4 rounded-2xl border" style={{ background:pieColors[s]+'10', borderColor:pieColors[s]+'30' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:pieColors[s] }}>{s}</p>
            <p className="text-3xl font-black text-white leading-none">{counts[s]??0}</p>
            <p className="text-[10px] mt-1" style={{ color:'#334155' }}>bookings</p>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <Card title="Monthly Booking Trend" badge="6-Month View" icon={TrendingUp}>
        <div style={{ height:200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK.monthly_bookings} margin={{ top:4, right:8, left:-16, bottom:0 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
              <XAxis dataKey="month" tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<TT/>}/>
              <Legend wrapperStyle={{ fontSize:10, color:'#94A3B8', paddingTop:4 }}/>
              <Bar dataKey="approved"  name="Approved"  fill={C.emerald} radius={[3,3,0,0]} barSize={14}/>
              <Bar dataKey="pending"   name="Pending"   fill={C.amber}   radius={[3,3,0,0]} barSize={14}/>
              <Bar dataKey="cancelled" name="Cancelled" fill={C.slate}   radius={[3,3,0,0]} barSize={14}/>
              <Bar dataKey="rejected"  name="Rejected"  fill={C.rose}    radius={[3,3,0,0]} barSize={14}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pivot table */}
        <Card className="lg:col-span-2" title="Room Booking Status — Pivot Table" badge="Slice & Dice" icon={Filter}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom:'1px solid #1E293B' }}>
                  {['Room','Approved','Pending','Cancelled','Rejected','Total','Util %'].map(h=>(
                    <th key={h} className="pb-2.5 text-center first:text-left text-[10px] font-black uppercase tracking-wider pr-3"
                      style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {utilization.map((r,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #1E293B30' }} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 pr-3 font-bold" style={{ color:'#CBD5E1' }}>{r.room_no}</td>
                    {[[r.approved,C.emerald],[r.pending,C.amber],[r.cancelled,C.slate],[r.rejected,C.rose]].map(([v,c],j)=>(
                      <td key={j} className="py-3 text-center">
                        {v>0 ? <span className="font-black text-sm" style={{ color:c }}>{v}</span>
                              : <span style={{ color:'#334155' }}>—</span>}
                      </td>
                    ))}
                    <td className="py-3 text-center font-black text-white">{r.total_bookings}</td>
                    <td className="py-3 text-center">
                      <span className="font-black text-xs px-2 py-0.5 rounded-full"
                        style={{ background:r.util_rate>70?C.emerald+'20':r.util_rate>40?C.amber+'20':C.rose+'20',
                                 color:r.util_rate>70?C.emerald:r.util_rate>40?C.amber:C.rose }}>
                        {r.util_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Booking Split" badge="Status" icon={Activity}>
            <div style={{ height:150, position:'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={44} outerRadius={64} paddingAngle={5} dataKey="value" nameKey="name" stroke="none">
                    {pieData.map((d,i)=><Cell key={i} fill={pieColors[d.name]??C.chart[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>{bookings.length}</span>
                <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>Total</span>
              </div>
            </div>
            <div className="p-3 rounded-xl mt-2 flex items-center justify-between"
              style={{ background:C.emerald+'10', border:`1px solid ${C.emerald}20` }}>
              <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>Approval Rate</span>
              <span className="text-xl font-black" style={{ color:C.emerald }}>{approvalRate}%</span>
            </div>
          </Card>

          <Card title="Peak Booking Hours" badge="Time Analysis" icon={Clock}>
            <div style={{ height:130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK.booking_hourly} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                  <XAxis dataKey="hour" tick={{ fill:'#475569', fontSize:8 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="count" name="Bookings" radius={[3,3,0,0]} barSize={12}>
                    {MOCK.booking_hourly.map((d,i)=><Cell key={i} fill={d.count>=28?C.rose:d.count>=20?C.amber:C.blue}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Bookings table */}
      <Card title="Booking Registry" badge="All Records" icon={Calendar}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:'1px solid #1E293B' }}>
                {['#','Date','Time','Room','Dept','Booked By','Purpose','Status'].map(h=>(
                  <th key={h} className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider pr-4 last:text-right"
                    style={{ color:'#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #1E293B30' }} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pr-4 font-mono" style={{ color:'#334155' }}>{b.id}</td>
                  <td className="py-3 pr-4 font-bold whitespace-nowrap" style={{ color:'#64748B' }}>{b.date}</td>
                  <td className="py-3 pr-4 font-mono whitespace-nowrap" style={{ color:'#475569' }}>{b.time}</td>
                  <td className="py-3 pr-4 font-bold whitespace-nowrap text-white">{b.room}</td>
                  <td className="py-3 pr-4 whitespace-nowrap" style={{ color:'#64748B' }}>{b.dept}</td>
                  <td className="py-3 pr-4 whitespace-nowrap" style={{ color:'#94A3B8' }}>{b.by}</td>
                  <td className="py-3 pr-4" style={{ color:'#64748B' }}>{b.purpose}</td>
                  <td className="py-3 text-right"><StatusBadge status={b.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 5 — MAINTENANCE
// ════════════════════════════════════════════════════════════════════════════
function MaintenancePage({ data }) {
  const tickets    = data?.tickets ?? MOCK.tickets;
  const open       = tickets.filter(t=>t.status==='Open').length;
  const inProgress = tickets.filter(t=>t.status==='In Progress').length;
  const resolved   = tickets.filter(t=>t.status==='Resolved').length;
  const closed     = tickets.filter(t=>t.status==='Closed').length;

  const priorityDist = ['Critical','High','Medium','Low'].map(p=>({
    name:p, count:tickets.filter(t=>t.priority===p).length,
  }));

  const roomFreq = tickets.reduce((acc,t)=>{ acc[t.room_no]=(acc[t.room_no]||0)+1; return acc; },{});
  const roomFreqData = Object.entries(roomFreq).map(([room,count])=>({ room, count })).sort((a,b)=>b.count-a.count);

  // MTTR simulation: resolved tickets have an age
  const resolvedTickets = tickets.filter(t=>t.status==='Resolved'||t.status==='Closed');
  const mttrByPriority = ['Critical','High','Medium','Low'].map(p=>({
    priority:p,
    avg_hours: p==='Critical'?8.4 : p==='High'?18.2 : p==='Medium'?36.8 : 72.1,
    target:    p==='Critical'?4   : p==='High'?12   : p==='Medium'?24   : 48,
  }));

  // Ticket aging (days since reported)
  const agingBuckets = [
    { range:'0–7 days',  count: tickets.filter(t=>{ const d=new Date(t.reported_date); return (Date.now()-d)/864e5 <= 7; }).length || 3 },
    { range:'8–14 days', count: tickets.filter(t=>{ const d=new Date(t.reported_date); const age=(Date.now()-d)/864e5; return age>7&&age<=14; }).length || 2 },
    { range:'15–30 days',count: tickets.filter(t=>{ const d=new Date(t.reported_date); const age=(Date.now()-d)/864e5; return age>14&&age<=30; }).length || 4 },
    { range:'>30 days',  count: tickets.filter(t=>{ const d=new Date(t.reported_date); return (Date.now()-d)/864e5 > 30; }).length || 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Open',        val:open,           color:C.rose    },
          { label:'In Progress', val:inProgress,     color:C.amber   },
          { label:'Resolved',    val:resolved,       color:C.emerald },
          { label:'Total',       val:tickets.length, color:C.blue    },
        ].map((s,i)=>(
          <div key={i} className="p-5 rounded-2xl border" style={{ background:s.color+'10', borderColor:s.color+'30' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:s.color }}>{s.label}</p>
            <p className="text-4xl font-black text-white leading-none">{s.val}</p>
            <p className="text-[10px] mt-1" style={{ color:'#334155' }}>tickets</p>
          </div>
        ))}
      </div>

      {/* MTTR by Priority */}
      <Card title="Mean Time To Resolve (MTTR) — SLA Performance" badge="SLA Analytics" icon={Gauge} accent={C.amber}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {mttrByPriority.map((m,i)=>{
              const pct = Math.min(100, (m.avg_hours/m.target)*100);
              const onTarget = m.avg_hours <= m.target;
              return (
                <div key={i} className="p-3 rounded-xl" style={{ background:'#1E293B30' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black" style={{ color:priorityColor(m.priority) }}>{m.priority}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{m.avg_hours}h avg</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background:onTarget?C.emerald+'20':C.rose+'20', color:onTarget?C.emerald:C.rose }}>
                        {onTarget?'✓ SLA met':'⚠ SLA breach'}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
                    <div className="h-full rounded-full" style={{ width:`${Math.min(100,(m.avg_hours/100)*100)}%`,
                      background:onTarget?priorityColor(m.priority):C.rose }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color:'#334155' }}>SLA target: {m.target}h</span>
                    <span className="text-[9px] font-bold" style={{ color:onTarget?C.emerald:C.rose }}>
                      {onTarget?`${(m.target-m.avg_hours).toFixed(1)}h under`:`${(m.avg_hours-m.target).toFixed(1)}h over`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color:'#475569' }}>Ticket Aging Analysis</p>
            <div style={{ height:180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingBuckets} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                  <XAxis dataKey="range" tick={{ fill:'#94A3B8', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="count" name="Tickets" radius={[5,5,0,0]} barSize={28}>
                    {agingBuckets.map((_,i)=><Cell key={i} fill={[C.emerald,C.amber,C.orange,C.rose][i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" title="Maintenance Ticket Queue" badge="Live Queue" icon={Wrench}>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {tickets.map((t,i)=>(
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{ background:'#1E293B30', border:'1px solid #1E293B50' }}>
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background:priorityColor(t.priority) }}/>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{t.description}</p>
                  <p className="text-[10px] mt-0.5" style={{ color:'#475569' }}>{t.room_no} · {t.reported_date}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[9px] font-black px-2 py-1 rounded-lg border"
                    style={{ color:priorityColor(t.priority), background:priorityColor(t.priority)+'15', borderColor:priorityColor(t.priority)+'30' }}>
                    {t.priority}
                  </span>
                  <StatusBadge status={t.status}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Priority Distribution" badge="Risk Overview" icon={AlertTriangle}>
            <div className="space-y-3">
              {priorityDist.map((p,i)=>(
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold" style={{ color:priorityColor(p.name) }}>{p.name}</span>
                    <span className="text-xs font-black text-white">{p.count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${tickets.length?(p.count/tickets.length)*100:0}%`, background:priorityColor(p.name) }}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl border" style={{ background:C.amber+'08', borderColor:C.amber+'20' }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:C.amber }}>SLA Compliance</p>
              <p className="text-3xl font-black text-white">{Math.round(((resolved+closed)/tickets.length)*100)}%</p>
              <p className="text-[10px] mt-1" style={{ color:'#475569' }}>{resolved+closed} of {tickets.length} resolved/closed</p>
            </div>
          </Card>

          <Card title="Hotspot Rooms" badge="Issue Freq." icon={Map}>
            <div className="space-y-2">
              {roomFreqData.slice(0,5).map((r,i)=>(
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background:'#1E293B40' }}>
                  <span className="text-[10px] font-black w-4 text-center" style={{ color:'#475569' }}>{i+1}</span>
                  <span className="text-xs font-bold flex-1 text-white">{r.room}</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background:i===0?C.rose+'20':C.amber+'20', color:i===0?C.rose:C.amber }}>{r.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 6 — ACCESS & SECURITY
// ════════════════════════════════════════════════════════════════════════════
function AccessPage({ data }) {
  const logs = data?.access_logs ?? MOCK.access_logs;
  const methodCounts = logs.reduce((acc,l)=>{ acc[l.method]=(acc[l.method]||0)+1; return acc; },{});
  const methodData = Object.entries(methodCounts).map(([name,value])=>({ name, value }));

  const roomAccess = logs.reduce((acc,l)=>{ acc[l.room_no]=(acc[l.room_no]||0)+1; return acc; },{});
  const roomAccessData = Object.entries(roomAccess).map(([room,count])=>({ room, count })).sort((a,b)=>b.count-a.count);

  const hourAccess = logs.reduce((acc,l)=>{
    const h = parseInt(l.entry_time.split(' ')[1]?.split(':')[0]||0);
    acc[h]=(acc[h]||0)+1; return acc;
  },{});
  const hourData = Array.from({length:24},(_,h)=>({ hour:`${h}h`, count:hourAccess[h]||0 })).filter(d=>d.count>0);

  const afterHours = logs.filter(l=>parseInt(l.entry_time.split(' ')[1]??'0')>=18).length;
  const securityScore = Math.max(0, 100 - afterHours*8 - (methodCounts['Manual']||0)*5);
  const uniqueUsers = new Set(logs.map(l=>l.name)).size;
  const avgDuration = Math.round(logs.reduce((a,l)=>a+(l.duration_min||0),0)/logs.length);

  const afterHoursLogs = logs.filter(l=>{
    const hr = parseInt(l.entry_time.split(' ')[1]?.split(':')[0]||'0');
    return hr>=18 || hr<7;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Total Entries', val:logs.length,    color:C.blue    },
          { label:'Unique Users',  val:uniqueUsers,     color:C.violet  },
          { label:'Avg Duration',  val:`${avgDuration} min`, color:C.emerald },
          { label:'After-Hours',   val:afterHours,      color:C.rose    },
        ].map((s,i)=>(
          <div key={i} className="p-5 rounded-2xl border" style={{ background:s.color+'10', borderColor:s.color+'30' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color:s.color }}>{s.label}</p>
            <p className="text-3xl font-black text-white leading-none">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Security Score + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Security Risk Score" badge="Live Score" icon={Shield} accent={securityScore>70?C.emerald:C.rose}>
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <svg viewBox="0 0 120 80" style={{ width:160 }}>
                <path d="M 10 70 A 50 50 0 0 1 110 70" stroke="#1E293B" strokeWidth="10" fill="none" strokeLinecap="round"/>
                <path d="M 10 70 A 50 50 0 0 1 110 70" stroke={securityScore>70?C.emerald:securityScore>40?C.amber:C.rose}
                  strokeWidth="10" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(securityScore/100)*157} 157`}/>
                <text x="60" y="64" textAnchor="middle" fill="#F1F5F9" fontSize="22" fontWeight="900">{securityScore}</text>
                <text x="60" y="76" textAnchor="middle" fill="#475569" fontSize="7" fontWeight="700">SECURITY SCORE</text>
              </svg>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {[
              { label:'Auth Methods',  val:Object.keys(methodCounts).length, max:4, ok:true  },
              { label:'After-Hours',   val:afterHours,                       max:5, ok:afterHours<=2 },
              { label:'Manual Entries',val:methodCounts['Manual']||0,        max:3, ok:(methodCounts['Manual']||0)===0 },
            ].map((r,i)=>(
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background:'#1E293B40' }}>
                <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>{r.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{r.val}</span>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ background:r.ok?C.emerald+'20':C.rose+'20', color:r.ok?C.emerald:C.rose }}>
                    {r.ok?'✓':'!'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Auth Method Split" badge="Security" icon={Shield}>
          <div style={{ height:160, position:'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={methodData} innerRadius={48} outerRadius={68} paddingAngle={5} dataKey="value" nameKey="name" stroke="none">
                  {methodData.map((_,i)=><Cell key={i} fill={C.chart[i]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:22, fontWeight:900, color:'#fff' }}>{logs.length}</span>
              <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase' }}>Entries</span>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {methodData.map((m,i)=>(
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background:'#1E293B40' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background:C.chart[i] }}/>
                  <span className="text-xs font-bold" style={{ color:'#CBD5E1' }}>{methodIcon(m.name)} {m.name}</span>
                </div>
                <span className="text-xs font-black text-white">{m.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Most Accessed Rooms" badge="Hotspots" icon={Eye}>
            <div className="space-y-2">
              {roomAccessData.slice(0,5).map((r,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background:'#1E293B40' }}>
                  <span className="text-[10px] font-black w-4" style={{ color:'#475569' }}>{i+1}</span>
                  <span className="text-xs font-bold flex-1 text-white">{r.room}</span>
                  <span className="text-xs font-black" style={{ color:C.chart[i] }}>{r.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {afterHoursLogs.length > 0 && (
            <Card title="After-Hours Alerts" badge="Security" icon={AlertTriangle} accent={C.rose}>
              <div className="space-y-2">
                {afterHoursLogs.map((l,i)=>(
                  <div key={i} className="p-2.5 rounded-xl" style={{ background:C.rose+'08', border:`1px solid ${C.rose}20` }}>
                    <p className="text-xs font-bold text-white">{l.name}</p>
                    <p className="text-[9px] mt-0.5" style={{ color:'#94A3B8' }}>
                      {l.room_no} · {l.entry_time.split(' ')[1]} · {l.method}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Access Log Entries" badge="Entry/Exit Tracking" icon={LogIn}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom:'1px solid #1E293B' }}>
                  {['#','User','Room','Method','Entry Time','Duration'].map(h=>(
                    <th key={h} className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider pr-4"
                      style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l,i)=>(
                  <tr key={i}
                    className="hover:bg-slate-800/20 transition-colors"
                    style={{ borderBottom:'1px solid #1E293B40',
                      background: parseInt((l.entry_time||'').split(' ')[1]||'0')>=18?C.rose+'06':'transparent' }}>
                    <td className="py-3 pr-4 font-mono" style={{ color:'#334155' }}>{l.log_id}</td>
                    <td className="py-3 pr-4 font-bold whitespace-nowrap text-white">{l.name}</td>
                    <td className="py-3 pr-4 whitespace-nowrap" style={{ color:'#94A3B8' }}>{l.room_no}</td>
                    <td className="py-3 pr-4">
                      <span style={{ color:'#CBD5E1' }}>{methodIcon(l.method)} {l.method}</span>
                    </td>
                    <td className="py-3 pr-4 font-mono" style={{ color:'#475569' }}>{l.entry_time.split(' ')[1]}</td>
                    <td className="py-3">
                      <span className="font-black text-white">{l.duration_min}</span>
                      <span className="ml-1" style={{ color:'#475569' }}>min</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {hourData.length > 0 && (
          <Card title="Peak Access Times" badge="Hourly Pattern" icon={Clock}>
            <div style={{ height:220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                  <XAxis dataKey="hour" tick={{ fill:'#94A3B8', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="count" name="Accesses" radius={[4,4,0,0]} barSize={24}>
                    {hourData.map((d,i)=><Cell key={i} fill={d.count>=3?C.rose:d.count>=2?C.amber:C.blue}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-3">
              {[{label:'High Risk (≥3)',color:C.rose},{label:'Moderate',color:C.amber},{label:'Normal',color:C.blue}].map((l,i)=>(
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background:l.color }}/>
                  <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 7 — USER ANALYTICS
// ════════════════════════════════════════════════════════════════════════════
function UsersPage({ data }) {
  const roles = data?.user_roles ?? MOCK.user_roles;
  const kpis  = data?.kpis       ?? MOCK.kpis;

  const deptActivity = [
    { dept:'CSE',  students:76, bookings:82, energy_kwh:524, faculty:8  },
    { dept:'ECE',  students:52, bookings:61, energy_kwh:281, faculty:6  },
    { dept:'DSAI', students:50, bookings:57, energy_kwh:200, faculty:5  },
  ];

  const topUsers = [
    { name:'Dr Rao',      type:'Faculty', dept:'CSE',  bookings:12, access:8,  energy:'High',   score:94 },
    { name:'Dr Sharma',   type:'Faculty', dept:'ECE',  bookings:10, access:7,  energy:'Medium', score:88 },
    { name:'Dr Mehta',    type:'Faculty', dept:'DSAI', bookings:9,  access:6,  energy:'Medium', score:84 },
    { name:'Gopal Gupta', type:'Student', dept:'DSAI', bookings:5,  access:4,  energy:'Low',    score:62 },
    { name:'Kavya Reddy', type:'Student', dept:'CSE',  bookings:4,  access:9,  energy:'Low',    score:71 },
    { name:'Arjun Kumar', type:'Student', dept:'CSE',  bookings:4,  access:3,  energy:'Low',    score:55 },
    { name:'Pradeep K.',  type:'Staff',   dept:'Admin',bookings:3,  access:12, energy:'Low',    score:68 },
    { name:'Ankita Shah', type:'Staff',   dept:'Admin',bookings:3,  access:10, energy:'Low',    score:65 },
  ];

  // Engagement quadrant data (bookings vs access)
  const engagementData = topUsers.map(u=>({ name:u.name, x:u.bookings, y:u.access, z:u.score, type:u.type }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon:Users,    label:'Students', val:76, color:C.blue   },
          { icon:BookOpen, label:'Faculty',  val:15, color:C.violet },
          { icon:Settings, label:'Staff',    val:15, color:C.teal   },
          { icon:Shield,   label:'Admin',    val:3,  color:C.rose   },
        ].map((s,i)=>(
          <div key={i} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background:s.color+'10', border:`1px solid ${s.color}30` }}>
            <div className="p-3 rounded-xl" style={{ background:s.color+'20', color:s.color }}><s.icon size={20}/></div>
            <div>
              <p className="text-3xl font-black text-white">{s.val}</p>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color:s.color }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dept activity */}
        <Card title="Department-wise Activity" badge="OLAP Drill-Down" icon={BarChart2}>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptActivity} barGap={4} barCategoryGap="30%" margin={{ top:4, right:8, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                <XAxis dataKey="dept" tick={{ fill:'#94A3B8', fontSize:12, fontWeight:700 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<TT/>}/>
                <Legend wrapperStyle={{ fontSize:10, color:'#94A3B8', paddingTop:6 }}/>
                <Bar dataKey="students" name="Students"  fill={C.blue}    radius={[4,4,0,0]} barSize={18}/>
                <Bar dataKey="bookings" name="Bookings"  fill={C.violet}  radius={[4,4,0,0]} barSize={18}/>
                <Bar dataKey="faculty"  name="Faculty"   fill={C.emerald} radius={[4,4,0,0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Engagement scatter */}
        <Card title="User Engagement Quadrant" badge="Bookings vs Access" icon={Target}>
          <div style={{ height:220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top:4, right:16, left:-20, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B"/>
                <XAxis type="number" dataKey="x" name="Bookings" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false} label={{ value:'Bookings', position:'insideBottom', offset:-2, fill:'#334155', fontSize:9 }}/>
                <YAxis type="number" dataKey="y" name="Access"   tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false} label={{ value:'Access', angle:-90, position:'insideLeft', fill:'#334155', fontSize:9 }}/>
                <ZAxis type="number" dataKey="z" range={[40,200]}/>
                <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload })=>{
                  if (!active||!payload?.length) return null;
                  const d=payload[0]?.payload;
                  return <div style={{ background:'#0A1628', border:'1px solid #1E293B', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
                    <p style={{ color:'#fff', fontWeight:700 }}>{d?.name}</p>
                    <p style={{ color:'#94A3B8' }}>Bookings: {d?.x} · Access: {d?.y}</p>
                    <p style={{ color:C.amber }}>Engagement: {d?.z}</p>
                  </div>;
                }}/>
                {['Faculty','Student','Staff'].map((type,ti)=>(
                  <Scatter key={type} name={type}
                    data={engagementData.filter(d=>d.type===type)}
                    fill={[C.violet,C.blue,C.teal][ti]}/>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {[['Faculty',C.violet],['Student',C.blue],['Staff',C.teal]].map(([t,c])=>(
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background:c }}/>
                <span className="text-[10px] font-bold" style={{ color:'#94A3B8' }}>{t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* User role pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="User Role Distribution" badge="Stakeholder Mix" icon={Users}>
          <div style={{ height:180, position:'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roles} innerRadius={50} outerRadius={72} paddingAngle={5} dataKey="value" nameKey="label" stroke="none">
                  {roles.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1E293B', border:'none', borderRadius:8, color:'#fff', fontSize:11 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <span style={{ fontSize:26, fontWeight:900, color:'#fff' }}>{kpis.users}</span>
              <span style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em' }}>Total</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {roles.map((r,i)=>(
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background:'#1E293B60' }}>
                <span className="w-2 h-2 rounded-full" style={{ background:C.chart[i%C.chart.length] }}/>
                <span className="text-[10px] font-bold truncate" style={{ color:'#94A3B8' }}>{r.label}</span>
                <span className="ml-auto text-[10px] font-black text-white">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top users */}
        <Card className="lg:col-span-2" title="Most Active Users" badge="Activity Ranking" icon={Award}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom:'1px solid #1E293B' }}>
                  {['Rank','Name','Type','Dept','Bookings','Access','Energy','Score'].map(h=>(
                    <th key={h} className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider pr-3"
                      style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #1E293B30' }} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-black"
                        style={{ background:i<3?C.amber+'20':'#1E293B', color:i<3?C.amber:'#475569' }}>{i+1}</span>
                    </td>
                    <td className="py-3 pr-3 font-bold text-white whitespace-nowrap">{u.name}</td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background:u.type==='Faculty'?C.violet+'20':u.type==='Student'?C.blue+'20':C.teal+'20',
                                 color:u.type==='Faculty'?C.violet:u.type==='Student'?C.blue:C.teal }}>
                        {u.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3" style={{ color:'#64748B' }}>{u.dept}</td>
                    <td className="py-3 pr-3 font-black text-white">{u.bookings}</td>
                    <td className="py-3 pr-3 font-black text-white">{u.access}</td>
                    <td className="py-3 pr-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                        style={{ background:u.energy==='High'?C.rose+'20':u.energy==='Medium'?C.amber+'20':C.emerald+'20',
                                 color:u.energy==='High'?C.rose:u.energy==='Medium'?C.amber:C.emerald }}>
                        {u.energy}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background:'#1E293B' }}>
                          <div className="h-full rounded-full" style={{ width:`${u.score}%`,
                            background:u.score>80?C.emerald:u.score>60?C.amber:C.rose }}/>
                        </div>
                        <span className="text-[10px] font-black" style={{ color:u.score>80?C.emerald:u.score>60?C.amber:C.rose }}>{u.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE 8 — DATA WAREHOUSE (COMPREHENSIVE)
// ════════════════════════════════════════════════════════════════════════════
function WarehousePage() {
  const [activeOlap, setActiveOlap] = useState(0);

  const olapRollup = [
    { period:'Mar 1', kwh:25.9, cost:220.2 }, { period:'Mar 2', kwh:20.6, cost:175.1 },
    { period:'Mar 3', kwh:23.4, cost:198.9 }, { period:'Mar Total', kwh:69.9, cost:594.2 },
    { period:'Q1 Total', kwh:69.9, cost:594.2 },
  ];

  const olapOps = [
    { op:'Roll-Up',    icon:ChevronUp,    desc:'Aggregate day → month → quarter → year', color:C.blue,
      sql:`SELECT YEAR(D.full_date) AS yr, MONTH(D.full_date) AS mo,\n  SUM(F.kwh_consumed) AS total_kwh\nFROM fact_energy_consumption F\nJOIN dim_date D ON F.date_key = D.date_key\nGROUP BY GROUPING SETS(\n  (YEAR(D.full_date), MONTH(D.full_date)),\n  (YEAR(D.full_date)),\n  ()\n)`,
      result:[{period:'2025-Mar',kwh:524.4},{period:'2025 Total',kwh:1406.2},{period:'Grand Total',kwh:1406.2}] },
    { op:'Drill-Down', icon:ChevronDown,  desc:'Campus → Building → Floor → Room', color:C.violet,
      sql:`SELECT B.bld_name, F.floor_label, R.room_no,\n  SUM(E.kwh_consumed) AS total_kwh\nFROM fact_energy_consumption F\nJOIN dim_room R ON F.room_key = R.room_key\nJOIN FLOOR FL ON R.floor_id = FL.floor_id\nJOIN BUILDING B ON FL.building_id = B.building_id\nGROUP BY B.bld_name, F.floor_label, R.room_no\nORDER BY B.bld_name, total_kwh DESC`,
      result:[{building:'E Block',floor:'3F',room:'L301',kwh:248.2},{building:'E Block',floor:'3F',room:'L201',kwh:196.6}] },
    { op:'Slice',      icon:Filter,       desc:'Filter: year = 2025, Computer Labs only', color:C.cyan,
      sql:`SELECT R.room_no, SUM(F.kwh_consumed) AS kwh\nFROM fact_energy_consumption F\nJOIN dim_room R ON F.room_key = R.room_key\nJOIN dim_date D ON F.date_key = D.date_key\nWHERE D.year = 2025\n  AND R.room_type = 'Computer Lab'\nGROUP BY R.room_no\nORDER BY kwh DESC`,
      result:[{room:'L301',kwh:248.2},{room:'L201',kwh:196.6},{room:'L202',kwh:157.8}] },
    { op:'Dice',       icon:Hash,         desc:'Q1 + CSE dept + Electricity meters', color:C.emerald,
      sql:`SELECT D.quarter, DR.dept_name,\n  SUM(F.kwh_consumed) AS kwh\nFROM fact_energy_consumption F\nJOIN dim_date D ON F.date_key = D.date_key\nJOIN dim_room DR ON F.room_key = DR.room_key\nJOIN dim_meter DM ON F.meter_key = DM.meter_key\nWHERE D.quarter = 1\n  AND DR.dept_name = 'CSE'\n  AND DM.meter_type = 'Electricity'\nGROUP BY D.quarter, DR.dept_name`,
      result:[{quarter:'Q1',dept:'CSE',kwh:312.4}] },
    { op:'Pivot',      icon:Table,        desc:'Buildings as columns, months as rows', color:C.amber,
      sql:`SELECT D.month_no,\n  SUM(CASE WHEN R.building_name='E Block' THEN F.kwh_consumed END) AS E_Block,\n  SUM(CASE WHEN R.building_name='PI Block' THEN F.kwh_consumed END) AS PI_Block\nFROM fact_energy_consumption F\nJOIN dim_date D ON F.date_key = D.date_key\nJOIN dim_room R ON F.room_key = R.room_key\nGROUP BY D.month_no\nORDER BY D.month_no`,
      result:[{month:'Jan',E_Block:412.3,PI_Block:98.4},{month:'Feb',E_Block:398.7,PI_Block:110.2}] },
  ];

  const comparison = [
    { metric:'Query Type',        oltp:'Short INSERT/UPDATE/SELECT', olap:'Complex aggregations'      },
    { metric:'Schema',            oltp:'Normalized (3NF/BCNF)',      olap:'Star/Snowflake (denorm)'   },
    { metric:'Data Volume',       oltp:'Current (days/weeks)',       olap:'Historical (months/years)' },
    { metric:'Concurrent Users',  oltp:'Many (100s)',                olap:'Few analysts'              },
    { metric:'Update Frequency',  oltp:'Continuous real-time',       olap:'Nightly ETL batch'         },
    { metric:'Response Time',     oltp:'Milliseconds',               olap:'Seconds to minutes'        },
    { metric:'Optimization',      oltp:'Write-optimized',            olap:'Read-optimized (indexes)'  },
    { metric:'Example Query',     oltp:'INSERT INTO BOOKING ...',    olap:'GROUP BY GROUPING SETS ...' },
  ];

  const warehouseKpis = [
    { label:'Fact Rows',    val:'515',    sub:'fact_energy_consumption', color:C.amber, icon:Database },
    { label:'Dim Rows',     val:'47',     sub:'3 dimension tables',      color:C.blue,  icon:Layers   },
    { label:'ETL Runs',     val:'9',      sub:'Since Jan 2025',          color:C.teal,  icon:GitBranch },
    { label:'Data Quality', val:'97.7%',  sub:'After IQR cleaning',      color:C.emerald,icon:Award   },
  ];

  const curOp = olapOps[activeOlap];

  return (
    <div className="space-y-6">
      {/* Warehouse KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {warehouseKpis.map((k,i)=>(
          <div key={i} className="p-5 rounded-2xl flex items-center gap-4"
            style={{ background:k.color+'10', border:`1px solid ${k.color}25` }}>
            <div className="p-3 rounded-xl" style={{ background:k.color+'20', color:k.color }}><k.icon size={20}/></div>
            <div>
              <p className="text-2xl font-black text-white">{k.val}</p>
              <p className="text-[9px] font-black uppercase tracking-wider" style={{ color:k.color }}>{k.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color:'#334155' }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ETL Pipeline */}
      <Card title="ETL Pipeline — OLTP → Data Warehouse" badge="Python + SQL Server" icon={Database}>
        <ETLPipelineVisual/>
        <div className="mt-5 p-4 rounded-xl" style={{ background:'#060F1C', border:'1px solid #1E293B' }}>
          <p className="text-[9px] font-black uppercase tracking-wider mb-2" style={{ color:'#475569' }}>Python ETL Script Logic</p>
          <pre style={{ color:'#64748B', fontSize:9.5, fontFamily:'monospace', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>
{`# 1. Get watermark — max(full_date) from dim_date in warehouse
# 2. Extract: SELECT * FROM ENERGY_READING WHERE timestamp > watermark
# 3. Clean:   Remove outliers (IQR: Q1 - 1.5×IQR < x < Q3 + 1.5×IQR)
# 4. Transform: Merge with dim_room, dim_meter → surrogate keys
# 5. Load:    df.to_sql('fact_energy_consumption', if_exists='append')`}
          </pre>
        </div>
      </Card>

      {/* ETL Run Log */}
      <Card title="ETL Run History" badge="Audit Log" icon={Clock}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:'1px solid #1E293B' }}>
                {['Run ID','Date','Extracted','Cleaned','Loaded','Duration','Status'].map(h=>(
                  <th key={h} className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider pr-4"
                    style={{ color:'#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK.etl_log.map((r,i)=>(
                <tr key={i} style={{ borderBottom:'1px solid #1E293B30' }} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pr-4 font-mono font-bold" style={{ color:'#94A3B8' }}>{r.run_id}</td>
                  <td className="py-3 pr-4 font-mono" style={{ color:'#475569' }}>{r.run_date}</td>
                  <td className="py-3 pr-4 font-black text-white">{r.rows_extracted}</td>
                  <td className="py-3 pr-4" style={{ color:C.amber }}>{r.rows_cleaned}</td>
                  <td className="py-3 pr-4" style={{ color:C.emerald }}>{r.rows_loaded}</td>
                  <td className="py-3 pr-4 font-mono" style={{ color:'#64748B' }}>{r.duration_s}s</td>
                  <td className="py-3"><StatusBadge status={r.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Star Schema Diagram */}
      <Card title="Star Schema — Fact & Dimension Tables" badge="Data Warehouse Design" icon={Server}>
        <p className="text-[10px] mb-4" style={{ color:'#475569' }}>
          Fact table in center connected to 4 dimension tables. Yellow = FACT, Blue/Purple/Teal/Green = DIMENSIONS
        </p>
        <StarSchemaDiagram/>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { table:'fact_energy_consumption', type:'FACT',      rows:515,  color:C.amber  },
            { table:'dim_date',                type:'DIMENSION', rows:365,  color:C.blue   },
            { table:'dim_room',                type:'DIMENSION', rows:16,   color:C.violet },
            { table:'dim_meter',               type:'DIMENSION', rows:27,   color:C.teal   },
          ].map((t,i)=>(
            <div key={i} className="p-3 rounded-xl" style={{ background:t.color+'08', border:`1px solid ${t.color}25` }}>
              <p className="text-[8px] font-black uppercase tracking-wider" style={{ color:t.color }}>{t.type}</p>
              <p className="text-[10px] font-bold text-white font-mono mt-1">{t.table}</p>
              <p className="text-lg font-black mt-1" style={{ color:t.color }}>{t.rows}</p>
              <p className="text-[9px]" style={{ color:'#334155' }}>rows</p>
            </div>
          ))}
        </div>
      </Card>

      {/* OLAP Operations Explorer */}
      <Card title="OLAP Operations Explorer" badge="Interactive Demo" icon={BarChart3} accent={C.violet}>
        <div className="flex gap-2 flex-wrap mb-5">
          {olapOps.map((o,i)=>(
            <button key={i} onClick={()=>setActiveOlap(i)}
              style={{
                padding:'7px 14px', borderRadius:10, border:'none', cursor:'pointer', fontSize:11, fontWeight:700,
                background: activeOlap===i ? o.color+'30' : '#1E293B40',
                color:       activeOlap===i ? o.color      : '#475569',
                borderBottom: activeOlap===i ? `2px solid ${o.color}` : '2px solid transparent',
                transition:'all 0.15s',
              }}>
              {o.op}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <curOp.icon size={14} style={{ color:curOp.color }}/>
              <p className="text-xs font-black text-white">{curOp.op} — {curOp.desc}</p>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background:'#060F1C', border:'1px solid #1E293B' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor:'#1E293B' }}>
                <Code2 size={12} style={{ color:curOp.color }}/>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color:curOp.color }}>SQL Query</span>
              </div>
              <pre style={{ padding:'16px', fontSize:10, color:'#64748B', fontFamily:'monospace', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap', overflowX:'auto' }}>
                {curOp.sql.split('\n').map((line,li)=>(
                  <span key={li}>
                    {line.split(/(\b(?:SELECT|FROM|JOIN|WHERE|GROUP BY|ORDER BY|CASE|WHEN|THEN|END|SUM|COUNT|MAX|YEAR|MONTH|ON|AND|AS|IN|BY)\b)/g).map((part,pi)=>(
                      /^(SELECT|FROM|JOIN|WHERE|GROUP BY|ORDER BY|CASE|WHEN|THEN|END|SUM|COUNT|MAX|YEAR|MONTH|ON|AND|AS|IN|BY)$/.test(part)
                        ? <span key={pi} style={{ color:curOp.color }}>{part}</span>
                        : <span key={pi}>{part}</span>
                    ))}
                    {'\n'}
                  </span>
                ))}
              </pre>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color:'#475569' }}>Sample Result</p>
            <div className="rounded-xl overflow-hidden" style={{ border:'1px solid #1E293B' }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:'#060F1C', borderBottom:'1px solid #1E293B' }}>
                <Play size={10} style={{ color:C.emerald }}/>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color:C.emerald }}>Query Result</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom:'1px solid #1E293B' }}>
                      {curOp.result.length > 0 && Object.keys(curOp.result[0]).map(k=>(
                        <th key={k} className="py-2 px-3 text-left text-[9px] font-black uppercase tracking-wider"
                          style={{ color:'#475569' }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {curOp.result.map((row,ri)=>(
                      <tr key={ri} style={{ borderBottom:'1px solid #1E293B30' }}>
                        {Object.entries(row).map(([k,v],vi)=>(
                          <td key={vi} className="py-2.5 px-3 font-mono"
                            style={{ color: typeof v==='number'?curOp.color:'#94A3B8', fontWeight: typeof v==='number'?900:400 }}>
                            {typeof v==='number'?Number(v).toFixed(1):v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Roll-up chart */}
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color:'#475569' }}>Roll-Up Chart</p>
              <div style={{ height:140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={olapRollup} margin={{ top:4, right:24, left:-16, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B"/>
                    <XAxis dataKey="period" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="r" orientation="right" tick={{ fill:'#475569', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<TT/>}/>
                    <Bar yAxisId="l" dataKey="kwh" name="kWh" fill={C.blue} opacity={0.8} radius={[5,5,0,0]} barSize={22}/>
                    <Line yAxisId="r" dataKey="cost" name="₹ Cost" stroke={C.amber} strokeWidth={2} dot={{ fill:C.amber, r:3 }}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* OLTP vs OLAP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="OLTP vs OLAP Comparison" badge="Unit IV" icon={BarChart2}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom:'1px solid #1E293B' }}>
                  {['Metric','OLTP (SmartCampusDB)','OLAP (Warehouse)'].map(h=>(
                    <th key={h} className="pb-2 text-left text-[10px] font-black uppercase tracking-wider pr-3"
                      style={{ color:'#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((r,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #1E293B30' }}>
                    <td className="py-2.5 pr-3 font-black text-white text-[10px]">{r.metric}</td>
                    <td className="py-2.5 pr-3 text-[10px]" style={{ color:C.blue }}>{r.oltp}</td>
                    <td className="py-2.5 text-[10px]" style={{ color:C.amber }}>{r.olap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Snowflake Extension — Normalized Dims" badge="Snowflake Schema" icon={Layers}>
          <div className="space-y-3">
            {[
              { label:'dim_building',   fields:['building_key PK','building_id','bld_name','bld_type','total_floors'], color:C.teal   },
              { label:'dim_department', fields:['dept_key PK','dept_id','dept_name','office_location'],               color:C.emerald },
            ].map((n,i)=>(
              <div key={i} className="p-4 rounded-xl border" style={{ borderColor:n.color+'30', background:n.color+'05' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background:n.color }}/>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color:n.color }}>SNOWFLAKE DIM</p>
                </div>
                <p className="text-[10px] font-black text-white mb-2 font-mono">{n.label}</p>
                <div className="space-y-0.5">
                  {n.fields.map((f,j)=><p key={j} className="text-[9px] font-mono"
                    style={{ color:f.includes('PK')?n.color:'#475569' }}>{f}</p>)}
                </div>
              </div>
            ))}
            <div className="p-4 rounded-xl" style={{ background:'#1E293B40', border:'1px solid #1E293B' }}>
              <p className="text-[10px] font-bold text-white mb-1">Drill-Down Hierarchy Chain</p>
              <p className="text-[10px] font-mono" style={{ color:C.teal }}>
                dim_room → dim_building → dim_department
              </p>
              <p className="text-[9px] mt-1" style={{ color:'#475569' }}>
                Enables: Campus → Dept → Building → Floor → Room analytics
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
//  NORMALIZATION PAGE  ——  Add this entire block into App.jsx
//
//  STEP 1: Add to the NAV array (after warehouse, before liveops):
//     { id:'normalization', icon:GitBranch, label:'Normalization' },
//
//  STEP 2: Add to the page routing section:
//     {page==='normalization' && <NormalizationPage />}
//
//  STEP 3: Make sure GitBranch is in your lucide-react import (it already is)
// ════════════════════════════════════════════════════════════════════════════

function NormalizationPage() {

  const [activeNF, setActiveNF] = React.useState('overview');

  // ── Palette shorthand ────────────────────────────────────────────────────
  const NF_COLORS = {
    '1NF': C.blue, '2NF': C.violet, '3NF': C.emerald, 'BCNF': C.amber,
  };

  // ── Table renderer helper ────────────────────────────────────────────────
  function NFTable({ headers, rows, highlightCols = [], strikeRows = [], title, subtitle, color }) {
    return (
      <div style={{ overflowX: 'auto' }}>
        {title && (
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 900, color: color || '#94A3B8', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 10, color: '#475569', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '7px 12px', textAlign: 'left', fontWeight: 900,
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: highlightCols.includes(i) ? (color || C.blue) + '25' : '#0D1A2E',
                  color: highlightCols.includes(i) ? (color || C.blue) : '#475569',
                  borderBottom: '1px solid #1E293B',
                  borderRight: i < headers.length - 1 ? '1px solid #0F172A' : 'none',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{
                background: strikeRows.includes(ri) ? '#F43F5E08' : ri % 2 === 0 ? '#060F1A' : 'transparent',
                borderBottom: '1px solid #0F172A',
              }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '6px 12px',
                    color: strikeRows.includes(ri) ? '#F43F5E60'
                      : highlightCols.includes(ci) ? (color || C.blue) : '#94A3B8',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 11,
                    textDecoration: strikeRows.includes(ri) ? 'line-through' : 'none',
                    borderRight: ci < row.length - 1 ? '1px solid #0F172A' : 'none',
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── FD Arrow visual ───────────────────────────────────────────────────────
  function FDArrow({ lhs, rhs, color = C.blue, violated = false }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(Array.isArray(lhs) ? lhs : [lhs]).map((a, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 900,
              background: (violated ? C.rose : color) + '20',
              color: violated ? C.rose : color,
              border: `1px solid ${violated ? C.rose : color}35`,
              fontFamily: 'monospace',
            }}>{a}</span>
          ))}
        </div>
        <span style={{ fontSize: 16, color: violated ? C.rose : '#334155' }}>
          {violated ? '⚠️→' : '→'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(Array.isArray(rhs) ? rhs : [rhs]).map((a, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: '#1E293B50', color: '#94A3B8',
              fontFamily: 'monospace',
            }}>{a}</span>
          ))}
        </div>
        {violated && (
          <span style={{ fontSize: 10, color: C.rose, fontWeight: 900, marginLeft: 4 }}>
            VIOLATES {violated}
          </span>
        )}
      </div>
    );
  }

  // ── Section tabs ─────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: '1NF', label: '1NF' },
    { id: '2NF', label: '2NF' },
    { id: '3NF', label: '3NF' },
    { id: 'BCNF', label: 'BCNF' },
    { id: 'summary', label: 'All Tables' },
  ];

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5">

      {/* Header + Tabs */}
      <Card title="Database Normalization Analysis" badge="SmartCampusDB · BCNF" icon={GitBranch} accent={C.violet}>
        <p style={{ fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 1.7 }}>
          All 12 OLTP tables in SmartCampusDB are normalized to <strong style={{ color: C.violet }}>Boyce-Codd Normal Form (BCNF)</strong>.
          The analysis below walks through each normalization step using real tables from the project,
          showing exactly which functional dependencies were identified and how violations were eliminated.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveNF(t.id)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 900,
              background: activeNF === t.id ? (NF_COLORS[t.id] || C.violet) + '25' : '#1E293B50',
              color: activeNF === t.id ? (NF_COLORS[t.id] || C.violet) : '#475569',
              borderBottom: activeNF === t.id ? `2px solid ${NF_COLORS[t.id] || C.violet}` : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
      {activeNF === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Normal Forms — Key Rules" icon={BookOpen} accent={C.blue}>
            <div className="space-y-3">
              {[
                { nf: '1NF', color: C.blue, rule: 'No repeating groups. Every cell holds a single atomic value. All columns are single-valued.' },
                { nf: '2NF', color: C.violet, rule: 'Must be in 1NF. Every non-key attribute must be fully functionally dependent on the entire primary key (eliminates partial dependency).' },
                { nf: '3NF', color: C.emerald, rule: 'Must be in 2NF. No transitive dependencies — non-key attributes must depend only on the primary key, not on other non-key attributes.' },
                { nf: 'BCNF', color: C.amber, rule: 'Stricter than 3NF. For every FD X→Y, X must be a superkey. Eliminates all anomalies even when there are overlapping candidate keys.' },
              ].map(({ nf, color, rule }) => (
                <div key={nf} style={{ padding: '10px 14px', borderRadius: 10, background: color + '08', border: `1px solid ${color}25` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color }}>{nf}</span>
                    <div style={{ flex: 1, height: 1, background: color + '20' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{rule}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Unnormalized Form — Before Decomposition" icon={AlertTriangle} accent={C.rose}>
            <p style={{ fontSize: 11, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              Imagine if we stored everything in one flat table before normalization. This is the <strong style={{ color: C.rose }}>UNF</strong> (Unnormalized Form) we started from:
            </p>
            <NFTable
              color={C.rose}
              headers={['booking_id', 'student_name', 'dept', 'room_no', 'bld_name', 'floor', 'equip_list', 'meter_type']}
              rows={[
                ['1', 'Arjun', 'CSE', 'L301', 'E Block', '3rd', 'PC,Proj,AC', 'Elec,Solar'],
                ['2', 'Priya', 'ECE', 'L101', 'E Block', '1st', 'OSC,FPGA', 'Elec'],
              ]}
              highlightCols={[6, 7]}
            />
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#F43F5E10', border: '1px solid #F43F5E25' }}>
              <p style={{ fontSize: 10, color: C.rose, fontWeight: 900, margin: 0 }}>❌ Problems in UNF:</p>
              <ul style={{ fontSize: 10, color: '#64748B', margin: '4px 0 0', paddingLeft: 14, lineHeight: 1.8 }}>
                <li><code style={{ color: C.rose }}>equip_list</code> has multiple values in one cell — violates atomicity</li>
                <li><code style={{ color: C.rose }}>meter_type</code> is a multi-valued attribute</li>
                <li>Massive update, insert, and delete anomalies</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {/* ── 1NF TAB ────────────────────────────────────────────────────── */}
      {activeNF === '1NF' && (
        <div className="space-y-5">
          <Card title="First Normal Form (1NF)" badge="Atomicity" icon={CheckCircle2} accent={C.blue}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, marginBottom: 12 }}>
                  <strong style={{ color: C.blue }}>Rule:</strong> Every column must contain atomic (indivisible) values. No repeating groups or multi-valued attributes.
                </p>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: C.rose + '10', border: `1px solid ${C.rose}30`, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.rose, margin: '0 0 6px' }}>❌ Before 1NF — Violations</p>
                  <NFTable
                    color={C.rose}
                    headers={['room_id', 'meter_types', 'equipment_list']}
                    rows={[
                      ['101', 'Electricity, Solar', 'Projector, AC, Router'],
                      ['109', 'Electricity', 'Desktop, Desktop'],
                    ]}
                    highlightCols={[1, 2]}
                  />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: C.blue + '10', border: `1px solid ${C.blue}30` }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.blue, margin: '0 0 6px' }}>✅ After 1NF — One value per cell</p>
                  <NFTable
                    color={C.blue}
                    headers={['meter_id', 'room_id', 'meter_type']}
                    rows={[
                      ['1', '101', 'Electricity'],
                      ['4', '101', 'Solar'],
                      ['2', '109', 'Electricity'],
                    ]}
                    highlightCols={[0]}
                  />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 8 }}>1NF Compliance in SmartCampusDB</p>
                {[
                  { table: 'ENERGY_METER', col: 'meter_type', fix: 'One meter per row — each meter_id is unique' },
                  { table: 'EQUIPMENT', col: 'serial_no', fix: 'One equipment item per row — separated from EQUIPMENT_TYPE' },
                  { table: 'TIME_SLOT', col: 'day_of_week', fix: 'Each slot is a single day + start_time + end_time — atomic' },
                  { table: 'ACCESS_LOG', col: 'access_method', fix: 'Single method per log entry (RFID/PIN/Biometric)' },
                  { table: 'BOOKING', col: 'status', fix: 'Single status value per booking — CHECK constraint enforces it' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#0D1A2E', border: '1px solid #1E293B', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: C.blue, fontFamily: 'monospace' }}>{r.table}</span>
                      <span style={{ fontSize: 9, color: '#334155' }}>·</span>
                      <span style={{ fontSize: 10, color: C.cyan, fontFamily: 'monospace' }}>{r.col}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#475569', margin: '3px 0 0', lineHeight: 1.5 }}>✅ {r.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── 2NF TAB ────────────────────────────────────────────────────── */}
      {activeNF === '2NF' && (
        <div className="space-y-5">
          <Card title="Second Normal Form (2NF)" badge="Full Functional Dependency" icon={CheckCircle2} accent={C.violet}>
            <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, marginBottom: 16 }}>
              <strong style={{ color: C.violet }}>Rule:</strong> Must be in 1NF. Every non-prime attribute must be <em>fully</em> functionally dependent on the <em>entire</em> primary key — not just part of it. This only matters when the primary key is composite.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.rose + '10', border: `1px solid ${C.rose}30`, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.rose, margin: '0 0 8px' }}>❌ Hypothetical Violation (if designed wrong)</p>
                  <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
                    Imagine a composite key table: <code style={{ color: C.rose, fontFamily: 'monospace' }}>(booking_id, room_id) → PK</code>
                  </p>
                  <NFTable
                    color={C.rose}
                    headers={['booking_id', 'room_id', 'room_type', 'capacity', 'status']}
                    rows={[
                      ['1', '109', 'Computer Lab', '60', 'Approved'],
                      ['2', '109', 'Computer Lab', '60', 'Pending'],
                      ['3', '101', 'Seminar Hall', '240', 'Approved'],
                    ]}
                    highlightCols={[2, 3]}
                    strikeRows={[]}
                  />
                  <div style={{ marginTop: 8 }}>
                    <FDArrow lhs="room_id" rhs={['room_type', 'capacity']} color={C.rose} violated="2NF" />
                    <p style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                      <code style={{ color: C.rose, fontFamily: 'monospace' }}>room_type, capacity</code> depend on <em>only</em> <code style={{ color: C.rose, fontFamily: 'monospace' }}>room_id</code> — partial dependency on composite key!
                    </p>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.violet + '10', border: `1px solid ${C.violet}30` }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.violet, margin: '0 0 8px' }}>✅ After 2NF — Decomposed into separate tables</p>
                  <p style={{ fontSize: 10, color: C.violet, fontFamily: 'monospace', marginBottom: 6 }}>ROOM table:</p>
                  <NFTable color={C.violet}
                    headers={['room_id (PK)', 'room_type', 'capacity', 'floor_id']}
                    rows={[['109', 'Computer Lab', '60', '6'], ['101', 'Seminar Hall', '240', '4']]}
                    highlightCols={[0]}
                  />
                  <p style={{ fontSize: 10, color: C.violet, fontFamily: 'monospace', margin: '10px 0 6px' }}>BOOKING table:</p>
                  <NFTable color={C.violet}
                    headers={['booking_id (PK)', 'room_id (FK)', 'user_id (FK)', 'status']}
                    rows={[['1', '109', '1', 'Approved'], ['2', '109', '3', 'Pending']]}
                    highlightCols={[0]}
                  />
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 10 }}>2NF Compliance: All Single-Column PKs</p>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, marginBottom: 12 }}>
                  A key design choice in SmartCampusDB: <strong style={{ color: C.violet }}>every table uses a single surrogate integer PK</strong>. This means partial dependencies <em>cannot exist by definition</em> — any non-key attribute that depends on only part of the key would require a composite key, which we eliminated by design.
                </p>
                {[
                  { table: 'BOOKING', pk: 'booking_id', fd: 'booking_id → room_id, user_id, start_time, end_time, status', ok: true },
                  { table: 'ENERGY_READING', pk: 'reading_id', fd: 'reading_id → timestamp, kwh_consumed, voltage, peak_flag, meter_id', ok: true },
                  { table: 'ACCESS_LOG', pk: 'log_id', fd: 'log_id → entry_time, exit_time, access_method, room_id, user_id', ok: true },
                  { table: 'MAINTENANCE_TICKET', pk: 'ticket_id', fd: 'ticket_id → description, priority, status, room_id, reported_by', ok: true },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#0D1A2E', border: '1px solid #1E293B', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: C.violet, fontFamily: 'monospace' }}>{r.table}</span>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, background: C.emerald + '20', color: C.emerald, fontWeight: 900 }}>✅ 2NF</span>
                    </div>
                    <p style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace', margin: 0 }}>{r.fd}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── 3NF TAB ────────────────────────────────────────────────────── */}
      {activeNF === '3NF' && (
        <div className="space-y-5">
          <Card title="Third Normal Form (3NF)" badge="No Transitive Dependencies" icon={CheckCircle2} accent={C.emerald}>
            <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, marginBottom: 16 }}>
              <strong style={{ color: C.emerald }}>Rule:</strong> Must be in 2NF. No non-key attribute should depend on another non-key attribute (no transitive dependencies). In other words: A → B → C is <em>not allowed</em> if B is not a key.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.rose + '10', border: `1px solid ${C.rose}30`, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.rose, margin: '0 0 8px' }}>❌ Transitive Dependency Example</p>
                  <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
                    Imagine ROOM stored dept_name directly:
                  </p>
                  <NFTable color={C.rose}
                    headers={['room_id', 'floor_id', 'building_id', 'dept_name']}
                    rows={[
                      ['109', '6', '2', 'CSE'],
                      ['106', '5', '2', 'CSE'],
                      ['101', '4', '2', 'CSE'],
                    ]}
                    highlightCols={[3]}
                  />
                  <div style={{ marginTop: 10 }}>
                    <FDArrow lhs="room_id" rhs="floor_id" color={C.emerald} />
                    <FDArrow lhs="floor_id" rhs="building_id" color={C.amber} />
                    <FDArrow lhs="building_id" rhs="dept_name" color={C.rose} violated="3NF" />
                    <p style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
                      <code style={{ color: C.rose, fontFamily: 'monospace' }}>dept_name</code> depends on <code style={{ color: C.rose, fontFamily: 'monospace' }}>building_id</code>, not directly on <code style={{ color: C.rose, fontFamily: 'monospace' }}>room_id</code>. That's a transitive dependency!
                    </p>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.emerald + '10', border: `1px solid ${C.emerald}30` }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.emerald, margin: '0 0 8px' }}>✅ After 3NF — Chain Broken Into 4 Tables</p>
                  {[
                    { name: 'ROOM', fields: 'room_id → room_no, capacity, room_type, floor_id' },
                    { name: 'FLOOR', fields: 'floor_id → floor_no, floor_label, building_id' },
                    { name: 'BUILDING', fields: 'building_id → bld_name, bld_type, dept_id' },
                    { name: 'DEPARTMENT', fields: 'dept_id → dept_name, office_location' },
                  ].map((t, i) => (
                    <div key={i} style={{ padding: '6px 10px', borderRadius: 7, background: '#060F1A', border: '1px solid #1E293B40', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: C.emerald, fontFamily: 'monospace' }}>{t.name}: </span>
                      <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>{t.fields}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#0D1A2E', border: '1px solid #1E293B', marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', marginBottom: 10 }}>All Transitive Chains Eliminated</p>
                  {[
                    {
                      bad: 'student_id → dept_id → dept_name',
                      fix: 'STUDENT stores dept_id (FK) only. DEPARTMENT holds dept_name.',
                      tables: ['STUDENT', 'DEPARTMENT'],
                    },
                    {
                      bad: 'faculty_id → dept_id → head_fac_id',
                      fix: 'FACULTY stores dept_id (FK). head_fac_id is in DEPARTMENT, not FACULTY.',
                      tables: ['FACULTY', 'DEPARTMENT'],
                    },
                    {
                      bad: 'equip_id → type_id → power_kw, manufacturer',
                      fix: 'EQUIPMENT stores type_id (FK). Power/manufacturer in EQUIPMENT_TYPE.',
                      tables: ['EQUIPMENT', 'EQUIPMENT_TYPE'],
                    },
                    {
                      bad: 'meter_id → room_id → floor_id → building_id',
                      fix: 'ENERGY_METER stores room_id (FK) only. Building chain in ROOM/FLOOR/BUILDING.',
                      tables: ['ENERGY_METER', 'ROOM', 'FLOOR', 'BUILDING'],
                    },
                  ].map((r, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: '#060F1A', border: '1px solid #1E293B', marginBottom: 6 }}>
                      <p style={{ fontSize: 9, color: C.rose, fontFamily: 'monospace', margin: '0 0 4px', textDecoration: 'line-through', opacity: 0.7 }}>
                        ✗ {r.bad}
                      </p>
                      <p style={{ fontSize: 10, color: '#64748B', margin: '0 0 5px' }}>✅ {r.fix}</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {r.tables.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: C.emerald + '15', color: C.emerald, fontFamily: 'monospace', fontWeight: 900 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── BCNF TAB ───────────────────────────────────────────────────── */}
      {activeNF === 'BCNF' && (
        <div className="space-y-5">
          <Card title="Boyce-Codd Normal Form (BCNF)" badge="Superkey Requirement" icon={Award} accent={C.amber}>
            <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.7, marginBottom: 16 }}>
              <strong style={{ color: C.amber }}>Rule:</strong> For every non-trivial functional dependency X → Y, X must be a <em>superkey</em>. BCNF is stricter than 3NF — it eliminates even the rare anomalies that 3NF can miss when there are multiple overlapping candidate keys.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.rose + '10', border: `1px solid ${C.rose}30`, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.rose, margin: '0 0 8px' }}>❌ Classic BCNF Violation (for understanding)</p>
                  <p style={{ fontSize: 10, color: '#64748B', marginBottom: 8 }}>
                    If BOOKING had <code style={{ color: C.rose, fontFamily: 'monospace' }}>slot_id → day_of_week</code> stored inline:
                  </p>
                  <NFTable color={C.rose}
                    headers={['booking_id', 'slot_id', 'day_of_week', 'room_id']}
                    rows={[
                      ['1', '1', 'Monday', '104'],
                      ['2', '1', 'Monday', '107'],
                      ['5', '5', 'Wednesday', '108'],
                    ]}
                    highlightCols={[1, 2]}
                  />
                  <div style={{ marginTop: 8 }}>
                    <FDArrow lhs="slot_id" rhs="day_of_week" color={C.rose} violated="BCNF" />
                    <p style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                      <code style={{ color: C.rose, fontFamily: 'monospace' }}>slot_id</code> is not a superkey of BOOKING, but it determines <code style={{ color: C.rose, fontFamily: 'monospace' }}>day_of_week</code>. That's a BCNF violation.
                    </p>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 10, background: C.amber + '10', border: `1px solid ${C.amber}30` }}>
                  <p style={{ fontSize: 10, fontWeight: 900, color: C.amber, margin: '0 0 8px' }}>✅ Our Fix — TIME_SLOT is a separate table</p>
                  <p style={{ fontSize: 10, color: C.amber, fontFamily: 'monospace', marginBottom: 6 }}>TIME_SLOT (standalone lookup):</p>
                  <NFTable color={C.amber}
                    headers={['slot_id (PK)', 'day_of_week', 'start_time', 'end_time', 'label']}
                    rows={[
                      ['1', 'Monday', '08:00', '09:00', 'Morning Slot 1'],
                      ['5', 'Wednesday', '11:00', '13:00', 'Pre-Lunch Double'],
                    ]}
                    highlightCols={[0]}
                  />
                  <p style={{ fontSize: 10, color: C.amber, fontFamily: 'monospace', margin: '10px 0 6px' }}>BOOKING (FK reference only):</p>
                  <NFTable color={C.amber}
                    headers={['booking_id (PK)', 'slot_id (FK)', 'room_id (FK)', 'status']}
                    rows={[['1', '1', '104', 'Approved'], ['5', '5', '108', 'Approved']]}
                    highlightCols={[0]}
                  />
                  <p style={{ fontSize: 10, color: '#64748B', marginTop: 8 }}>
                    Now <strong style={{ color: C.amber }}>every determinant is a superkey</strong>. <code style={{ color: C.amber, fontFamily: 'monospace' }}>slot_id → day_of_week</code> is fine because slot_id is the PK of TIME_SLOT.
                  </p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', marginBottom: 10 }}>BCNF Verification: All 12 Tables</p>
                {[
                  { table: 'DEPARTMENT', superkey: 'dept_id', fds: 'dept_id → dept_name, office_location, head_fac_id' },
                  { table: 'USERS', superkey: 'user_id', fds: 'user_id → name, email, phone, user_type' },
                  { table: 'STUDENT', superkey: 'student_id', fds: 'student_id → user_id, roll_no, year_of_study, dept_id' },
                  { table: 'FACULTY', superkey: 'faculty_id', fds: 'faculty_id → user_id, designation, employee_no, dept_id' },
                  { table: 'BUILDING', superkey: 'building_id', fds: 'building_id → bld_name, total_floors, bld_type, dept_id' },
                  { table: 'FLOOR', superkey: 'floor_id', fds: 'floor_id → floor_no, floor_label, building_id' },
                  { table: 'ROOM', superkey: 'room_id', fds: 'room_id → room_no, capacity, room_type, area_sqft, floor_id' },
                  { table: 'EQUIPMENT_TYPE', superkey: 'type_id', fds: 'type_id → type_name, power_kw, manufacturer' },
                  { table: 'EQUIPMENT', superkey: 'equip_id', fds: 'equip_id → serial_no, purchase_date, status, room_id, type_id' },
                  { table: 'ENERGY_METER', superkey: 'meter_id', fds: 'meter_id → meter_type, install_date, is_active, room_id' },
                  { table: 'ENERGY_READING', superkey: 'reading_id', fds: 'reading_id → timestamp, kwh_consumed, voltage, peak_flag, meter_id' },
                  { table: 'BOOKING', superkey: 'booking_id', fds: 'booking_id → start_time, end_time, purpose, status, room_id, user_id' },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 7,
                    background: '#060F1A', border: '1px solid #1E293B',
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 5, background: C.amber + '20', color: C.amber, fontFamily: 'monospace', fontWeight: 900, flexShrink: 0 }}>
                      {r.superkey}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', fontFamily: 'monospace' }}>{r.table}</span>
                      <p style={{ fontSize: 8.5, color: '#334155', fontFamily: 'monospace', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.fds}</p>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, background: C.emerald + '15', color: C.emerald, fontWeight: 900, flexShrink: 0 }}>BCNF ✓</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── SUMMARY TAB ────────────────────────────────────────────────── */}
      {activeNF === 'summary' && (
        <div className="space-y-5">
          <Card title="Complete Functional Dependency Map" badge="All 12 Tables" icon={Table} accent={C.violet}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                { table: 'DEPARTMENT', color: C.blue, pk: 'dept_id', attrs: ['dept_name', 'office_location', 'head_fac_id (FK)'], nf: 'BCNF' },
                { table: 'USERS', color: C.violet, pk: 'user_id', attrs: ['name', 'email (UNIQUE)', 'phone', 'user_type'], nf: 'BCNF' },
                { table: 'STUDENT', color: C.cyan, pk: 'student_id', attrs: ['user_id (FK)', 'roll_no (UNIQUE)', 'year_of_study', 'dept_id (FK)'], nf: 'BCNF' },
                { table: 'FACULTY', color: C.indigo, pk: 'faculty_id', attrs: ['user_id (FK)', 'designation', 'employee_no (UNIQUE)', 'dept_id (FK)'], nf: 'BCNF' },
                { table: 'BUILDING', color: C.teal, pk: 'building_id', attrs: ['bld_name', 'total_floors', 'bld_type', 'year_built', 'dept_id (FK)'], nf: 'BCNF' },
                { table: 'FLOOR', color: C.emerald, pk: 'floor_id', attrs: ['floor_no', 'floor_label', 'building_id (FK)'], nf: 'BCNF' },
                { table: 'ROOM', color: C.lime, pk: 'room_id', attrs: ['room_no', 'capacity', 'room_type', 'area_sqft', 'floor_id (FK)'], nf: 'BCNF' },
                { table: 'EQUIPMENT_TYPE', color: C.amber, pk: 'type_id', attrs: ['type_name', 'power_kw', 'manufacturer'], nf: 'BCNF' },
                { table: 'EQUIPMENT', color: C.orange, pk: 'equip_id', attrs: ['serial_no (UNIQUE)', 'purchase_date', 'status', 'room_id (FK)', 'type_id (FK)'], nf: 'BCNF' },
                { table: 'ENERGY_METER', color: C.rose, pk: 'meter_id', attrs: ['meter_type', 'install_date', 'is_active', 'room_id (FK)'], nf: 'BCNF' },
                { table: 'ENERGY_READING', color: C.pink, pk: 'reading_id', attrs: ['timestamp', 'kwh_consumed', 'voltage', 'peak_flag', 'meter_id (FK)'], nf: 'BCNF' },
                { table: 'BOOKING', color: C.slate, pk: 'booking_id', attrs: ['start_time', 'end_time', 'purpose', 'status', 'room_id (FK)', 'user_id (FK)', 'slot_id (FK)'], nf: 'BCNF' },
              ].map((t, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: t.color + '08', border: `1px solid ${t.color}25` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: t.color, fontFamily: 'monospace' }}>{t.table}</span>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, background: C.emerald + '20', color: C.emerald, fontWeight: 900 }}>{t.nf} ✓</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: t.color + '25', color: t.color, fontFamily: 'monospace', fontWeight: 900 }}>
                      🔑 {t.pk}
                    </span>
                    <span style={{ color: '#1E293B', fontSize: 14 }}>→</span>
                    {t.attrs.map((a, ai) => (
                      <span key={ai} style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 4,
                        background: a.includes('FK') ? '#1E4ED820' : a.includes('UNIQUE') ? '#8B5CF620' : '#1E293B',
                        color: a.includes('FK') ? C.cyan : a.includes('UNIQUE') ? C.violet : '#475569',
                        fontFamily: 'monospace',
                      }}>{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Normalization vs Denormalization — OLTP vs OLAP Trade-off" badge="Design Decision" icon={Database} accent={C.amber}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: C.emerald, marginBottom: 8 }}>✅ OLTP — Normalized (BCNF)</p>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, marginBottom: 10 }}>
                  The 12 OLTP tables minimize redundancy. Changing a room's type only requires updating <strong style={{ color: C.emerald }}>one row</strong> in ROOM. No update anomalies.
                </p>
                <NFTable color={C.emerald}
                  headers={['FD Type', 'Count', 'Status']}
                  rows={[
                    ['Partial Dependencies', '0', '✅ Eliminated'],
                    ['Transitive Dependencies', '0', '✅ Eliminated'],
                    ['BCNF Violations', '0', '✅ None'],
                    ['Tables in BCNF', '12/12', '✅ 100%'],
                  ]}
                  highlightCols={[2]}
                />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 900, color: C.amber, marginBottom: 8 }}>⚡ OLAP Warehouse — Intentionally Denormalized</p>
                <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, marginBottom: 10 }}>
                  The <code style={{ color: C.amber, fontFamily: 'monospace' }}>dim_room</code> table deliberately stores building_name, floor_label, and dept_name together (denormalized) to <strong style={{ color: C.amber }}>optimize analytical queries</strong>. This is the Star Schema trade-off.
                </p>
                <NFTable color={C.amber}
                  headers={['dim_room column', 'OLTP Source', 'Why Denorm']}
                  rows={[
                    ['building_name', 'BUILDING.bld_name', 'Avoid JOIN in OLAP'],
                    ['floor_label', 'FLOOR.floor_label', 'Avoid JOIN in OLAP'],
                    ['dept_name', 'DEPARTMENT.dept_name', 'Avoid JOIN in OLAP'],
                    ['room_type', 'ROOM.room_type', 'Frequently filtered'],
                  ]}
                  highlightCols={[2]}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
// ══════════════════ END OF NormalizationPage ════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
//  ROOT APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authUser, setAuthUser] = useState(()=>{
    const u = localStorage.getItem('sc_user');
    return u ? JSON.parse(u) : null;
  });
  const [page,     setPage]     = useState('overview');
  const [sideOpen, setSideOpen] = useState(true);
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sc_token');
      const res = await fetch(API_URL, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Backend offline');
      setData(await res.json());
      setLastSync(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError('Demo mode — connect backend_api.py for live data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, [fetchData]);

  function handleLogin(loginData) {
    localStorage.setItem('sc_user', JSON.stringify(loginData));
    if (loginData.token) {
      localStorage.setItem('sc_token', loginData.token);
    }
    setAuthUser(loginData);
  }

  function handleLogout() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setAuthUser(null);
  }

  if (!authUser) return <LoginPage onLogin={handleLogin} />;

  const activeNav = NAV.find(n=>n.id===page);

  return (
    <div style={{
      display:'flex', minHeight:'100vh',
      background:'#020B18', color:'#CBD5E1',
      fontFamily:"'DM Sans','Inter',system-ui,sans-serif",
      overflowX:'hidden',
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sideOpen ? 230 : 56,
        transition:'width 0.25s ease',
        flexShrink:0,
        background:'#060F1C',
        borderRight:'1px solid #1E293B',
        display:'flex', flexDirection:'column',
        position:'sticky', top:0, height:'100vh', overflowY:'auto',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'20px 14px', borderBottom:'1px solid #1E293B',
          justifyContent: sideOpen?'flex-start':'center',
          overflow:'hidden', flexShrink:0,
        }}>
          <div style={{
            width:36, height:36, borderRadius:10, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          }}>
            <Zap size={18} color="#fff" fill="#fff"/>
          </div>
          {sideOpen && (
            <div>
              <p style={{ fontSize:13, fontWeight:900, color:'#F1F5F9', lineHeight:1 }}>SmartCampus</p>
              <p style={{ fontSize:9, fontWeight:700, color:'#334155', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:3 }}>
                IIIT Dharwad
              </p>
            </div>
          )}
        </div>

        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {NAV.filter(n => !n.adminOnly || authUser?.role === 'admin').map(n=>{
            const active = page===n.id;
            return (
              <button key={n.id} onClick={()=>setPage(n.id)}
                title={!sideOpen?n.label:undefined}
                style={{
                  display:'flex', alignItems:'center',
                  gap: sideOpen?10:0,
                  justifyContent: sideOpen?'flex-start':'center',
                  padding:'9px 10px', borderRadius:10,
                  border:'none', cursor:'pointer',
                  background: active?'linear-gradient(135deg, #3B82F620, #8B5CF620)':'transparent',
                  color: active?'#93C5FD':'#475569',
                  fontWeight:700, fontSize:12,
                  transition:'all 0.15s ease',
                  outline:'none',
                  borderLeft: active?`2px solid #3B82F6`:'2px solid transparent',
                  flexShrink:0,
                }}>
                <n.icon size={16}/>
                {sideOpen && <span style={{ whiteSpace:'nowrap' }}>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        {sideOpen && (
          <div style={{
            margin:'0 10px 10px', padding:'12px', borderRadius:12,
            background:'#0D1A2E', border:'1px solid #1E293B', textAlign:'center', flexShrink:0,
          }}>
            <p style={{ fontSize:9, fontWeight:900, color:'#3B82F6', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:6 }}>System Status</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 6px #10B981' }}/>
              <span style={{ fontSize:10, fontWeight:700, color:'#10B981' }}>All Nodes Active</span>
            </div>
            <p style={{ fontSize:9, color:'#1E293B', marginTop:6 }}>SmartCampusDB · v2.0</p>
          </div>
        )}

        <button onClick={()=>setSideOpen(p=>!p)}
          style={{
            margin:'0 10px 12px', padding:'9px', borderRadius:10, flexShrink:0,
            background:'transparent', border:'1px solid #1E293B',
            color:'#475569', cursor:'pointer', display:'flex',
            alignItems:'center', justifyContent:'center',
            transition:'all 0.15s',
          }}>
          {sideOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Topbar */}
        <header style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 24px', borderBottom:'1px solid #1E293B',
          background:'rgba(2,11,24,0.92)', backdropFilter:'blur(12px)',
          position:'sticky', top:0, zIndex:10, flexShrink:0,
        }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h1 style={{ fontSize:20, fontWeight:900, color:'#F1F5F9', margin:0 }}>{activeNav?.label}</h1>
              {error && (
                <span style={{ fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:999,
                  background:'#F59E0B15', color:'#F59E0B', border:'1px solid #F59E0B25',
                  display:'flex', alignItems:'center', gap:4 }}>
                  <AlertCircle size={9}/> Demo Mode
                </span>
              )}
            </div>
            <p style={{ fontSize:10, fontWeight:700, color:'#1E293B', textTransform:'uppercase', letterSpacing:'0.12em', marginTop:2 }}>
              IIIT Dharwad · Smart Campus Resource & Energy Analytics · DA264
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0A1628', border:'1px solid #1E293B', borderRadius:10, padding:'7px 12px' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:10, fontWeight:900, color:'#fff' }}>{authUser?.full_name?.[0]?.toUpperCase()||'U'}</span>
              </div>
              <div style={{ lineHeight:1 }}>
                <p style={{ fontSize:11, fontWeight:800, color:'#F1F5F9', margin:0 }}>{authUser?.full_name || authUser?.username}</p>
                <p style={{ fontSize:9, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', margin:0 }}>{authUser?.role}</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#0A1628', border:'1px solid #1E293B', borderRadius:10, padding:'7px 12px' }}>
              <Clock size={12} color="#475569"/>
              <span style={{ fontSize:11, fontWeight:700, color:'#475569', fontVariantNumeric:'tabular-nums' }}>{lastSync??'--:--:--'}</span>
            </div>
            <button onClick={fetchData} style={{
              padding:'9px', borderRadius:10,
              background:'#0A1628', border:'1px solid #1E293B',
              color:'#475569', cursor:'pointer', display:'flex',
              alignItems:'center', justifyContent:'center',
            }}>
              <RefreshCcw size={15} style={loading?{ animation:'spin 1s linear infinite' }:{}}/>
            </button>
            <button onClick={handleLogout} title="Logout" style={{
              padding:'9px 14px', borderRadius:10,
              background:'#F43F5E10', border:'1px solid #F43F5E30',
              color:'#F43F5E', cursor:'pointer', display:'flex',
              alignItems:'center', gap:6,
              fontSize:11, fontWeight:800, transition:'all 0.15s',
            }}
            onMouseEnter={e=>{ e.currentTarget.style.background='#F43F5E20'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='#F43F5E10'; }}>
              <LogOut size={14}/>
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', padding:'24px' }}>
          <style>{`
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            ::-webkit-scrollbar{width:4px;height:4px}
            ::-webkit-scrollbar-track{background:#0A1628}
            ::-webkit-scrollbar-thumb{background:#1E293B;border-radius:4px}
          `}</style>
          {page==='overview'       && <OverviewPage     data={data}/>}
          {page==='energy'         && <EnergyPage       data={data}/>}
          {page==='infrastructure' && <InfraPage        data={data}/>}
          {page==='bookings'       && <BookingsPage     data={data}/>}
          {page==='maintenance'    && <MaintenancePage  data={data}/>}
          {page==='access'         && <AccessPage       data={data}/>}
          {page==='users'          && <UsersPage        data={data}/>}
          {page==='normalization' && <NormalizationPage />}
          {page==='warehouse'      && <WarehousePage/>}
          {page==='liveops' && (
            authUser?.role === 'admin'
              ? <LiveOpsPage data={data} onRefresh={fetchData}/>
              : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
                  <div style={{ fontSize:48 }}>🔒</div>
                  <h2 style={{ color:'#F1F5F9', fontWeight:900, margin:0 }}>Access Restricted</h2>
                  <p style={{ color:'#475569', fontSize:14, margin:0 }}>Live Operations is only available to admin users.</p>
                </div>
          )}
        </main>
      </div>
    </div>
  );
}
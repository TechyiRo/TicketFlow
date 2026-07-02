import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import Space3DBackground from '../../components/shared/Space3DBackground';
import { Users, Briefcase, Ticket as TicketIcon, CheckCircle, Activity, ArrowRight, Shield } from 'lucide-react';

// Count-up helper component using requestAnimationFrame
const CountUp = ({ to }) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (to === 0) {
      setVal(0);
      return;
    }
    let startTimestamp = null;
    const duration = 1200; // 1.2s

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setVal(Math.floor(progress * to));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setVal(to);
      }
    };

    window.requestAnimationFrame(step);
  }, [to]);

  return <span>{val}</span>;
};

// 3D Tilt Card with pulsing border and floating icon
const StatCard = ({ title, value, icon: Icon, color, delay }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12; // Max rotation 12deg
    const rotateY = ((x - centerX) / centerX) * 12;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        perspective: '1000px',
        animation: `slideUpFade 0.6s ease-out ${delay}s backwards`,
      }}
      className="w-full"
    >
      <div
        style={{
          transform: isHovered 
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.04, 1.04, 1.04)` 
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
          transformStyle: 'preserve-3d',
          background: 'rgba(6, 9, 24, 0.6)',
          backdropFilter: 'blur(20px)',
          borderColor: isHovered ? color : 'rgba(0, 229, 255, 0.12)',
          boxShadow: isHovered 
            ? `0 0 25px ${color}33, inset 0 0 15px ${color}15` 
            : '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.03)',
        }}
        className="w-full h-36 rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300"
      >
        {/* Glow corner */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 100% 0%, ${color}, transparent 65%)`,
            transform: 'translateZ(-10px)',
          }}
        />

        {/* Content */}
        <div className="flex justify-between items-start" style={{ transform: 'translateZ(25px)' }}>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-text-secondary uppercase tracking-widest mb-1" style={{ color: 'rgba(148, 163, 184, 0.7)' }}>
              {title}
            </span>
            <span className="text-3xl font-black text-white tracking-tight">
              <CountUp to={value} />
            </span>
          </div>
          
          {/* Pulsing/Floating Icon container */}
          <div 
            className={`w-11 h-11 rounded-xl flex items-center justify-center border border-white/5`}
            style={{ 
              backgroundColor: `${color}15`, 
              boxShadow: `0 0 15px ${color}33`,
              animation: isHovered ? 'spinSlow 6s linear infinite' : 'floatIcon 3s ease-in-out infinite',
              transition: 'all 0.3s',
            }}
          >
            <Icon style={{ color, width: 20, height: 20 }} />
          </div>
        </div>

        {/* Pulsing neon border line at the bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`, 
            transform: 'translateZ(10px)',
            opacity: isHovered ? 1 : 0.6,
            animation: 'pulseGlow 2.5s infinite ease-in-out'
          }}
        />
      </div>
    </div>
  );
};

// SVG-based Animated Area Chart Component
const ActivityChart = ({ data }) => {
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const svgWidth = 600;
  const svgHeight = 150;
  const padding = 25;

  const maxCount = Math.max(...data.map(d => d.count), 4);
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  // Generate points
  const points = data.map((d, i) => {
    const x = padding + i * (chartWidth / (data.length - 1));
    const y = padding + chartHeight - (d.count / maxCount) * chartHeight;
    return { x, y };
  });

  const linePath = points.reduce((path, pt, i) => {
    return path + `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `;
  }, '');

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z` 
    : '';

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
          7-Day Ticket Activity
        </h3>
        <span className="text-[10px] uppercase font-bold text-text-secondary">
          Live feed metrics
        </span>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height: `${svgHeight}px` }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          <defs>
            {/* Cyan-Purple Gradient for line fill */}
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#7B2FFF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#7B2FFF" />
            </linearGradient>
            
            {/* Draw animation clipPath */}
            <clipPath id="chartClip">
              <rect 
                x="0" 
                y="0" 
                height={svgHeight} 
                width={animated ? svgWidth : 0} 
                style={{ transition: 'width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)' }}
              />
            </clipPath>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * chartHeight;
            return (
              <line 
                key={idx} 
                x1={padding} 
                y1={y} 
                x2={svgWidth - padding} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeDasharray="4"
              />
            );
          })}

          {/* Area & Line paths */}
          {points.length > 0 && (
            <g clipPath="url(#chartClip)">
              <path d={areaPath} fill="url(#chartGrad)" />
              <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" />
              
              {/* Point circles */}
              {points.map((pt, idx) => (
                <circle 
                  key={idx} 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="4" 
                  fill="#00E5FF" 
                  stroke="#020308" 
                  strokeWidth="2.5" 
                  style={{ filter: 'drop-shadow(0 0 4px #00E5FF)' }}
                />
              ))}
            </g>
          )}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            const x = padding + i * (chartWidth / (data.length - 1));
            return (
              <text 
                key={i} 
                x={x} 
                y={svgHeight - 5} 
                fill="rgba(148, 163, 184, 0.6)" 
                fontSize="10" 
                fontWeight="700" 
                textAnchor="middle"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { stats, tickets, employees, loading, fetchStats, fetchTickets, fetchEmployees } = useAdmin();

  useEffect(() => {
    fetchStats();
    fetchTickets();
    fetchEmployees();
  }, [fetchStats, fetchTickets, fetchEmployees]);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#020308]">
        <div className="relative flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00E5FF]" />
          <span className="text-xs font-bold text-text-secondary tracking-widest uppercase">Initializing Command...</span>
        </div>
      </div>
    );
  }

  const { users, employees: employeeCount, tickets: ticketCounts } = stats;

  // Compute stats correctly
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  
  // Resolved tickets count (we check for status === 'resolved')
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  
  const activeEmployees = employees.length;

  // Generate 7-day chart data based on tickets history
  const getChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const count = tickets.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate.getDate() === d.getDate() &&
               tDate.getMonth() === d.getMonth() &&
               tDate.getFullYear() === d.getFullYear();
      }).length;
      data.push({ label, count });
    }
    return data;
  };

  const chartData = getChartData();

  // Grab the 5 most recent tickets for the feed
  const recentTickets = [...tickets].slice(0, 5);

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'critical':
      case 'high':
        return '#FF4C4C'; // Danger Red
      case 'medium':
        return '#FFB347'; // Warning Amber
      case 'low':
      default:
        return '#00E5FF'; // Electric Cyan
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#00E5FF'; // Cyan
      case 'in_progress':
        return '#7B2FFF'; // Purple
      case 'on_hold':
        return '#FFB347'; // Amber
      case 'resolved':
        return '#10B981'; // Green
      case 'closed':
      default:
        return '#64748B'; // Muted Grey
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#020308] relative overflow-x-hidden overflow-y-auto pb-10">
      {/* 3D Wireframe Globe and Drifting Particle Canvas */}
      <Space3DBackground globePosition="top-right" />

      {/* Futuristic Scanline Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 z-0" 
        style={{
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px'
        }}
      />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Command Header Banner */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(6, 9, 24, 0.7) 0%, rgba(3, 5, 12, 0.4) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.04)',
          }}
          className="rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden relative"
        >
          {/* Corner scanlines decoration */}
          <div className="absolute right-0 top-0 w-24 h-24 border-t border-r border-[#00E5FF]/20 rounded-tr-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-24 h-24 border-b border-l border-[#00E5FF]/20 rounded-bl-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#00E5FF] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF]">System Command Node</span>
            </div>
            <h1 
              style={{ textShadow: '0 0 12px rgba(0,229,255,0.2)' }}
              className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
            >
              System Overview
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-semibold max-w-xl">
              Control center node. Oversee tickets, allocate resources, verify password audits, and resolve employee queues.
            </p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Tickets" 
            value={totalTickets} 
            icon={TicketIcon} 
            color="#7B2FFF" // Purple
            delay={0.1}
          />
          <StatCard 
            title="Open Tickets" 
            value={openTickets} 
            icon={Activity} 
            color="#00E5FF" // Cyan
            delay={0.2}
          />
          <StatCard 
            title="Resolved Tickets" 
            value={resolvedCount} 
            icon={CheckCircle} 
            color="#10B981" // Green
            delay={0.3}
          />
          <StatCard 
            title="Active Employees" 
            value={activeEmployees} 
            icon={Briefcase} 
            color="#FFB347" // Amber
            delay={0.4}
          />
        </div>

        {/* Mid Grid: Activity Chart & Health Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Panel */}
          <div 
            style={{
              background: 'rgba(6, 9, 24, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(0, 229, 255, 0.12)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
            className="lg:col-span-2 rounded-2xl p-6 overflow-hidden relative"
          >
            <ActivityChart data={chartData} />
          </div>

          {/* Control Quick Stats */}
          <div 
            style={{
              background: 'rgba(6, 9, 24, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(0, 229, 255, 0.12)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
            className="rounded-2xl p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#7B2FFF] mb-5 drop-shadow-[0_0_8px_rgba(123,47,255,0.4)]">
                Sync Gateway
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold text-white">
                    <span>Database Connection</span> 
                    <span className="text-[#00E5FF]">Active</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] h-1.5 rounded-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold text-white">
                    <span>Network Uptime</span> 
                    <span>99.98%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] h-1.5 rounded-full w-[99%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1 font-bold text-white">
                    <span>Admin Session Auth</span> 
                    <span className="text-xs text-[#00E5FF]">Secure</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] h-1.5 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-center text-[10px] uppercase font-bold text-text-secondary">
              <span>Secure Auditing Node</span>
              <span className="text-accent-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-ping" /> Online
              </span>
            </div>
          </div>
        </div>

        {/* Live Ticket Feed */}
        <div 
          style={{
            background: 'rgba(6, 9, 24, 0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 229, 255, 0.12)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          }}
          className="rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                Live Ticket Activity Feed
              </h3>
              <p className="text-[10px] text-text-secondary font-bold uppercase mt-1">
                Real-time queue of recently updated or submitted tickets
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-semibold text-white/90">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-text-secondary uppercase tracking-widest font-bold">
                      No tickets found in feed
                    </td>
                  </tr>
                ) : (
                  recentTickets.map((t) => {
                    const statusColor = getStatusColor(t.status);
                    const prioColor = getPriorityColor(t.priority);
                    return (
                      <tr 
                        key={t._id}
                        className="transition-all duration-200 cursor-pointer hover:bg-[#00E5FF]/[0.03] hover:shadow-[inset_0_0_10px_rgba(0,229,255,0.04)]"
                      >
                        <td className="py-3 px-4 font-mono text-[#00E5FF]">{t.ticketId}</td>
                        <td className="py-3 px-4 truncate max-w-xs">{t.title}</td>
                        <td className="py-3 px-4">
                          <span 
                            style={{ 
                              color: prioColor,
                              borderColor: `${prioColor}33`,
                              backgroundColor: `${prioColor}15`
                            }}
                            className="px-2.5 py-0.5 rounded-full border text-[9px] uppercase font-black tracking-wider"
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span 
                            style={{ 
                              color: statusColor,
                              borderColor: `${statusColor}33`,
                              boxShadow: `0 0 10px ${statusColor}22`,
                              backgroundColor: `${statusColor}15`
                            }}
                            className="px-2.5 py-0.5 rounded-full border text-[9px] uppercase font-black tracking-wider inline-flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{t.createdBy?.fullName || 'Client'}</td>
                        <td className="py-3 px-4 text-text-secondary">
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Global CSS keyframes for custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatIcon {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.3); }
        }
      `}} />
    </div>
  );
}

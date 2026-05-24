interface HeaderProps {
  temp: number;
  aiActive: boolean;
}

export default function Header({ temp, aiActive }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50 bg-cyber-darker/80 backdrop-blur-sm">
      {/* Left - Live indicator */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75 animate-pulse-dot" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyber-cyan" />
        </span>
        <span className="text-xs font-semibold tracking-[0.2em] text-cyber-cyan font-mono">
          LIVE TRACKING
        </span>
      </div>

      {/* Right - Environment & Connection */}
      <div className="flex items-center gap-5 text-xs text-slate-400 font-mono">
        <span>
          {'☀'} {temp}°C
        </span>
        <span className={aiActive ? 'text-cyber-cyan' : 'text-slate-500'}>
          {'🔗'} AI {aiActive ? 'Active' : 'Offline'}
        </span>
      </div>
    </header>
  );
}

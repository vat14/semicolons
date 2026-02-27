import { NavLink } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Home',
    subtitle: 'Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
      </svg>
    ),
  },
  {
    to: '/inventory',
    label: 'Warehouse',
    subtitle: 'Inventory & Predict',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    to: '/vision',
    label: 'Vision',
    subtitle: 'Engine',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/logistics',
    label: 'Logistics',
    subtitle: 'Fleet',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-industrial-800 border-r border-industrial-600 flex flex-col flex-shrink-0">
      {/* Logo / Title */}
      <div className="px-5 py-5 border-b border-industrial-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-cyan/20 rounded-lg flex items-center justify-center
                          border border-accent-cyan/30 animate-glow">
            <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-gray-100 leading-tight">
              Smart Logistics
            </h1>
            <p className="text-[10px] text-industrial-300 tracking-wider uppercase">
              & Inventory
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shadow-lg shadow-accent-cyan/5'
                  : 'text-industrial-200 hover:bg-industrial-700 hover:text-gray-100 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-accent-cyan' : 'text-industrial-400 group-hover:text-industrial-200'
                }`}>
                  {item.icon}
                </span>
                <div>
                  <span className="text-sm font-medium block leading-tight">{item.label}</span>
                  <span className={`text-[10px] tracking-wider uppercase ${
                    isActive ? 'text-accent-cyan/60' : 'text-industrial-400'
                  }`}>
                    {item.subtitle}
                  </span>
                </div>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-industrial-600">
        <div className="flex items-center gap-2">
          <span className="status-dot-live" />
          <span className="text-[10px] text-industrial-300 uppercase tracking-wider">
            System Online
          </span>
        </div>
        <p className="text-[9px] text-industrial-500 mt-1 font-mono">
          v2.0 — Multi-View Dashboard
        </p>
      </div>
    </aside>
  );
}

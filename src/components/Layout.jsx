import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import LogisAIChatbox from './LogisAIChatbox';

export default function Layout() {
  return (
    <div className="min-h-screen bg-industrial-900 flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <LogisAIChatbox />
    </div>
  );
}

import React from 'react';
import Sidebar from './Sidebar';

export default function PageLayout({ children, role }: { children: React.ReactNode; role: string }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar role={role} />
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

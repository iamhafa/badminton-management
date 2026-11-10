import SettingsNav from '@/components/settings/SettingsNav';
import type { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SettingsNav />
      {children}
    </div>
  );
}


import type { ReactNode } from 'react';
import { GlobalHeader } from './GlobalHeader';
import { FileAnalysisBar } from './FileAnalysisBar';
import { NavigationBar, type TabId } from './NavigationBar';
import type { UploadResponse } from '../../types';

export interface AppShellProps {
  children: ReactNode;
  data: UploadResponse | null;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onReset: () => void;
  reducedMotion?: boolean;
}

export function AppShell({
  children,
  data,
  activeTab,
  onTabChange,
  onReset,
  reducedMotion = false,
}: AppShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {/* Global 56px Header */}
      <GlobalHeader onReset={onReset} showResetButton={!!data} />

      {/* Sticky File Metadata Strip (when data is loaded) */}
      {data && <FileAnalysisBar metadata={data.metadata} />}

      {/* Sticky Navigation Tabs (when data is loaded) */}
      {data && (
        <NavigationBar
          activeTab={activeTab}
          onTabChange={onTabChange}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Main Content Area */}
      <main className={data ? 'app-main-content' : undefined}>
        {children}
      </main>
    </div>
  );
}

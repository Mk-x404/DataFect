import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Table,
  ShieldCheck,
  ArrowLeftRight,
  Brain,
  MessageSquare
} from 'lucide-react';

export type TabId = 'overview' | 'columns' | 'quality' | 'insights' | 'predict' | 'chat';

interface TabItem {
  id: TabId;
  label: string;
  icon: ComponentType<any>;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'columns', label: 'Columns', icon: Table },
  { id: 'quality', label: 'Quality Audit', icon: ShieldCheck },
  { id: 'insights', label: 'Correlations & Summary', icon: ArrowLeftRight },
  { id: 'predict', label: 'Prediction Lab', icon: Brain },
  { id: 'chat', label: 'Data Assistant', icon: MessageSquare },
];

export interface NavigationBarProps {
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  reducedMotion?: boolean;
}

export function NavigationBar({
  activeTab,
  onTabChange,
  reducedMotion = false,
}: NavigationBarProps) {
  return (
    <nav
      style={{
        borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-surface)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: '98px',
        zIndex: 'var(--z-sticky)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      <ul
        style={{
          display: 'flex',
          gap: '24px',
          padding: 0,
          margin: 0,
          listStyle: 'none',
          minWidth: 'max-content',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <li key={tab.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 2px 14px 2px',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                  outline: 'none',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <Icon
                  size={16}
                  style={{
                    color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                    transition: 'color var(--transition-fast)',
                  }}
                />
                <span>{tab.label}</span>
              </button>

              {/* Bottom Border Active Tab Indicator */}
              {isActive && (
                reducedMotion ? (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: 'var(--color-ink)',
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                ) : (
                  <motion.div
                    layoutId="activeTabUnderline"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: 'var(--color-ink)',
                      borderRadius: '2px 2px 0 0',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 38,
                    }}
                  />
                )
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

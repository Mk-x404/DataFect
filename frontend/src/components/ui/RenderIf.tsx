import type { ReactNode } from 'react';

export interface RenderIfProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RenderIf({ condition, children, fallback = null }: RenderIfProps) {
  if (!condition) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

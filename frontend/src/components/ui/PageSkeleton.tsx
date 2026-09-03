import { Card } from './Card';
import { Skeleton } from './Skeleton';

export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0', width: '100%' }}>
      {/* Top row skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
        <Card variant="flat" style={{ padding: '20px', height: '110px' }}>
          <Skeleton width="40%" height="14px" style={{ marginBottom: '12px' }} />
          <Skeleton width="60%" height="28px" />
        </Card>
        <Card variant="flat" style={{ padding: '20px', height: '110px' }}>
          <Skeleton width="45%" height="14px" style={{ marginBottom: '12px' }} />
          <Skeleton width="55%" height="28px" />
        </Card>
        <Card variant="flat" style={{ padding: '20px', height: '110px' }}>
          <Skeleton width="35%" height="14px" style={{ marginBottom: '12px' }} />
          <Skeleton width="70%" height="28px" />
        </Card>
      </div>

      {/* Main content skeleton */}
      <Card variant="flat" style={{ padding: '24px', height: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="25%" height="20px" />
          <Skeleton width="15%" height="24px" borderRadius="var(--radius-pill)" />
        </div>
        <Skeleton width="100%" height="100%" borderRadius="var(--radius-sm)" />
      </Card>
    </div>
  );
}

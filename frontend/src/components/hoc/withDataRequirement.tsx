import type { ComponentType } from 'react';
import { useDataset } from '../../hooks/useDataset';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { UploadCloud } from 'lucide-react';
import type { UploadResponse } from '../../types';

export interface WithDataProps {
  data: UploadResponse;
}

export function withDataRequirement<P extends WithDataProps>(
  WrappedComponent: ComponentType<P>
) {
  return function WithDataRequirementWrapper(props: Omit<P, keyof WithDataProps> & { data?: UploadResponse }) {
    const { analysisData, resetAnalysis } = useDataset();
    const effectiveData = props.data || analysisData;

    if (!effectiveData) {
      return (
        <Card
          variant="flat"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            maxWidth: '560px',
            margin: '40px auto',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand-lake-deep)',
            }}
          >
            <UploadCloud size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)' }}>
            No Active Dataset Loaded
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', lineHeight: 1.5, maxWidth: '420px' }}>
            Please upload a dataset or return to the landing page to access this analysis view.
          </p>
          <Button variant="primary" size="sm" onClick={resetAnalysis}>
            Return to Upload
          </Button>
        </Card>
      );
    }

    return <WrappedComponent {...(props as any)} data={effectiveData} />;
  };
}

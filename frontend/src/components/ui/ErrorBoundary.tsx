import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DataLens UI Uncaught Exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '3rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
          <Card
            variant="elevated"
            style={{
              padding: '32px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              borderColor: 'var(--color-critical-border)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-critical-subtle)',
                color: 'var(--color-critical)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
                Rendering Error
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-secondary)', lineHeight: 1.5 }}>
                An unexpected display error occurred while rendering the data views.
              </p>
            </div>

            {this.state.error && (
              <div
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-hairline)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-critical-text)',
                  textAlign: 'left',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <Button variant="primary" size="md" onClick={this.handleReset} icon={<RefreshCw size={14} />}>
              Reset & Try Again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

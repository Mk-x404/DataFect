import { FileSpreadsheet, Table, Layers, HardDrive } from 'lucide-react';
import type { FileMetadata } from '../../types';

export interface FileAnalysisBarProps {
  metadata: FileMetadata;
}

export function FileAnalysisBar({ metadata }: FileAnalysisBarProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-hairline)',
        backgroundColor: 'var(--color-surface)',
        padding: '0 24px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-ink-secondary)',
        position: 'sticky',
        top: '56px',
        zIndex: 'var(--z-sticky)',
        overflowX: 'auto',
      }}
    >
      {/* Left: File name & delimiter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'max-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileSpreadsheet size={15} style={{ color: 'var(--color-info)' }} />
          <span
            className="font-mono"
            style={{
              fontWeight: 700,
              color: 'var(--color-ink)',
              fontSize: '13px',
            }}
          >
            {metadata.filename}
          </span>
        </div>

        <span style={{ color: 'var(--color-hairline-strong)' }}>|</span>

        <span style={{ color: 'var(--color-ink-muted)' }}>
          Delimiter: <code style={{ fontSize: '11px', padding: '1px 5px' }}>{metadata.delimiter === '\t' ? 'TAB' : metadata.delimiter === ',' ? 'COMMA' : `"${metadata.delimiter}"`}</code>
        </span>

        <span style={{ color: 'var(--color-hairline-strong)' }}>|</span>

        <span style={{ color: 'var(--color-ink-muted)' }}>
          Encoding: <strong style={{ color: 'var(--color-ink)' }}>{metadata.encoding}</strong>
        </span>
      </div>

      {/* Right: Dimension & Size Readouts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 'max-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Table size={13} style={{ color: 'var(--color-ink-muted)' }} />
          <span className="tabular">
            <strong style={{ color: 'var(--color-ink)' }}>{(metadata?.row_count ?? 0).toLocaleString()}</strong> rows
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Layers size={13} style={{ color: 'var(--color-ink-muted)' }} />
          <span className="tabular">
            <strong style={{ color: 'var(--color-ink)' }}>{metadata?.column_count ?? 0}</strong> columns
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HardDrive size={13} style={{ color: 'var(--color-ink-muted)' }} />
          <span className="tabular">
            <strong style={{ color: 'var(--color-ink)' }}>{(metadata?.file_size_mb ?? 0).toFixed(2)}</strong> MB
          </span>
        </div>

      </div>
    </div>
  );
}

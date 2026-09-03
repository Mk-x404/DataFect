import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileCode,
  FileText,
  ShieldCheck
} from 'lucide-react';
import type { AnalysisStage } from '../../hooks/useAnalysis';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface UploadPageProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
  stage: AnalysisStage;
  progress: number;
  error: string | null;
  onReset: () => void;
}

export function UploadPage({
  onUpload,
  isAnalyzing,
  stage,
  progress,
  error,
  onReset
}: UploadPageProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check file size (50MB limit)
    const MAX_SIZE_MB = 50;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_SIZE_MB) {
      alert(`File is too large (${fileSizeMB.toFixed(1)}MB). The limit is ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Check extensions
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'json', 'xlsx', 'xls'].includes(ext || '')) {
      alert('Unsupported file format. Please upload a CSV, JSON, or Excel file.');
      return;
    }

    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    validateAndUpload(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndUpload(e.target.files);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };



  if (isAnalyzing) {
    const steps = [
      { id: 'parsing', label: 'Parsing dataset records and encodings' },
      { id: 'cleaning', label: 'Applying non-destructive data cleaning' },
      { id: 'profiling', label: 'Calculating NIST percentiles & distributions' },
      { id: 'predicting', label: 'Training AutoML predictive models' }
    ];

    const currentStageIndex = steps.findIndex(s => s.id === stage);

    return (
      <Card
        variant="elevated"
        style={{
          maxWidth: '560px',
          margin: '4rem auto',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '8px' }}>
            Autonomous Data Pipeline
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
            Processing {progress}% complete...
          </p>
        </div>

        {/* Inner Progress Bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--color-info)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.3s ease-out'
            }}
          />
        </div>

        {/* Progressive Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          {steps.map((step, idx) => {
            const isCompleted = currentStageIndex > idx || progress === 100;
            const isCurrent = currentStageIndex === idx && progress < 100;
            const isPending = currentStageIndex < idx;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: isPending ? 0.4 : 1,
                  transition: 'opacity 0.3s'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted ? 'var(--color-success)' : isCurrent ? 'transparent' : 'var(--color-surface-subtle)',
                  border: isCurrent ? '2px solid var(--color-info)' : 'none',
                  color: isCompleted ? '#fff' : 'var(--color-ink-muted)'
                }}>
                  {isCompleted ? <ShieldCheck size={14} /> : isCurrent ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-info)' }} /> : <span style={{ fontSize: '12px' }}>{idx + 1}</span>}
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? 'var(--color-ink)' : 'var(--color-ink-secondary)'
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  if (error) {
    const isConnection = error.toLowerCase().includes('connect') || error.toLowerCase().includes('server') || error.toLowerCase().includes('reach') || error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network');
    const isEncoding = error.toLowerCase().includes('encoding') || error.toLowerCase().includes('utf-8');
    const isEmptyOrRows = error.toLowerCase().includes('empty') || error.toLowerCase().includes('no columns') || error.toLowerCase().includes('rows');
    const isFormat = error.toLowerCase().includes('format') || error.toLowerCase().includes('extension') || error.toLowerCase().includes('unsupported');
    const isTooLarge = error.toLowerCase().includes('large') || error.toLowerCase().includes('limit');

    let title = "Dataset Processing Failed";
    let helpfulTip = "Review your file format and ensure it contains well-structured tabular data with headers.";
    if (isConnection) {
      title = "Unable to Process Dataset";
      helpfulTip = "We were unable to complete the analysis request. Please verify your file and try uploading again.";
    } else if (isEncoding) {
      title = "File Encoding Unreadable";
      helpfulTip = "We couldn't decode the file characters. Try re-saving your dataset as UTF-8 CSV or standard Excel (.xlsx).";
    } else if (isEmptyOrRows) {
      title = "Empty or Insufficient Data";
      helpfulTip = "The uploaded file has no valid data rows or recognizable columns. Make sure your file has a header row and at least 2 rows of values.";
    } else if (isFormat) {
      title = "Unsupported File Format";
      helpfulTip = "Please upload a supported format: CSV (.csv), Excel (.xlsx / .xls), or JSON (.json).";
    } else if (isTooLarge) {
      title = "File Size Exceeded";
      helpfulTip = "The file exceeds our 100MB limit. Try filtering or reducing rows before uploading.";
    }

    return (
      <Card
        variant="flat"
        style={{
          maxWidth: '580px',
          margin: '3.5rem auto',
          padding: '36px 28px',
          borderColor: 'var(--color-critical-border)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-critical-subtle)',
            color: 'var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-ink)' }}>
            {title}
          </h2>
          <p style={{ color: 'var(--color-ink-secondary)', marginBottom: '18px', fontSize: '13.5px', lineHeight: 1.55 }}>
            {helpfulTip}
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--color-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-hairline)',
          padding: '12px 14px',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-ink-muted)' }}>
              Diagnostic Message
            </span>
            <button
              onClick={() => setShowTechDetails(!showTechDetails)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-info)',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {showTechDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>
          <div style={{
            fontSize: '12.5px',
            color: 'var(--color-ink)',
            marginTop: '6px',
            fontFamily: showTechDetails ? 'monospace' : 'inherit',
            whiteSpace: showTechDetails ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
            maxHeight: showTechDetails ? '160px' : 'none',
            overflowY: showTechDetails ? 'auto' : 'visible'
          }}>
            {isConnection ? "The analysis service was momentarily unreachable. Please try again." : error}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button variant="primary" size="md" onClick={onReset} icon={<RefreshCw size={14} />}>
            Upload Another Dataset
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '3rem auto' }}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        style={{
          border: '1px dashed',
          borderColor: isDragActive ? 'var(--color-ink)' : 'var(--color-hairline-strong)',
          backgroundColor: isDragActive ? 'var(--color-surface-hover)' : 'var(--color-surface)',
          borderRadius: 'var(--radius-cards)',
          boxShadow: 'var(--shadow-card)',
          padding: '60px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-normal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".csv,.json,.xlsx,.xls"
          style={{ display: 'none' }}
        />

        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface-subtle)',
          color: 'var(--color-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--color-hairline)'
        }}>
          <Upload size={22} />
        </div>

        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '4px', color: 'var(--color-ink)' }}>
            Drag & drop your dataset here
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
            or click to browse local files from your computer
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--color-ink-muted)',
          fontWeight: 500,
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Badge variant="neutral" size="sm" icon={<FileSpreadsheet size={12} style={{ color: 'var(--color-info)' }} />}>
            CSV / Excel (.xlsx)
          </Badge>
          <Badge variant="neutral" size="sm" icon={<FileCode size={12} style={{ color: 'var(--color-info)' }} />}>
            JSON Records
          </Badge>
          <Badge variant="neutral" size="sm" icon={<ShieldCheck size={12} style={{ color: 'var(--color-success)' }} />}>
            Privacy Protected
          </Badge>
          <Badge variant="neutral" size="sm" icon={<FileText size={12} />}>
            Max 50MB
          </Badge>
        </div>
      </div>
    </div>
  );
}

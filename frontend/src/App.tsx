import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';

import { DatasetProvider } from './context/DatasetContext';
import { useDataset } from './hooks/useDataset';
import { useReducedMotion } from './hooks/useReducedMotion';
import { uploadFile, initSession } from './api/client';
import { ToastProvider } from './context/ToastContext';

// Core Eager Page Components (Instant rendering)
import { HeroPage } from './components/pages/HeroPage';
import { UploadPage } from './components/pages/UploadPage';
import { DashboardOverview } from './components/pages/DashboardOverview';
import { ColumnInspector } from './components/pages/ColumnInspector';
import { QualityAudit } from './components/pages/QualityAudit';

// Code-split Lazy Page Components (On-demand download for ~700 kB initial bundle)
const InsightsStory = lazy(() =>
  import('./components/pages/InsightsStory').then((m) => ({ default: m.InsightsStory }))
);
const PredictionLab = lazy(() =>
  import('./components/pages/PredictionLab').then((m) => ({ default: m.PredictionLab }))
);
const DataAssistant = lazy(() =>
  import('./components/pages/DataAssistant').then((m) => ({ default: m.DataAssistant }))
);

import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSkeleton } from './components/ui/PageSkeleton';

// Layout Components
import { AppShell } from './components/layout/AppShell';
import type { TabId } from './components/layout/NavigationBar';
import { PageTransition } from './components/layout/PageTransition';

function AppContent() {
  const [screen, setScreen] = useState<'landing' | 'upload' | 'dashboard'>('landing');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const reducedMotion = useReducedMotion();

  const {
    file,
    isAnalyzing,
    stage,
    progress,
    analysisData,
    error,
    uploadAndAnalyze,
    resetAnalysis,
    setAnalysisData,
  } = useDataset();

  // Initialize zero-trust session handshake and transition to dashboard on data complete
  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    if (analysisData) {
      setScreen('dashboard');
    }
  }, [analysisData]);

  const handleStartAnalysis = (selectedFile: File) => {
    uploadAndAnalyze(selectedFile);
    setScreen('upload');
  };

  const handleRetrainModel = async (targetCol: string) => {
    if (!file) return;
    setIsRetraining(true);
    try {
      const updatedData = await uploadFile(file, targetCol);
      setAnalysisData(updatedData);
    } catch (err: any) {
      alert(`Model training failed: ${err.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleReset = () => {
    resetAnalysis();
    setActiveTab('overview');
    setScreen('landing');
  };

  const renderActiveTabContent = () => {
    if (!analysisData) return null;

    switch (activeTab) {
      case 'overview':
        return <DashboardOverview data={analysisData} />;
      case 'columns':
        return <ColumnInspector data={analysisData} />;
      case 'quality':
        return <QualityAudit data={analysisData} />;
      case 'insights':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <InsightsStory data={analysisData} />
          </Suspense>
        );
      case 'predict':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <PredictionLab
              data={analysisData}
              onRetrain={handleRetrainModel}
              isRetraining={isRetraining}
            />
          </Suspense>
        );
      case 'chat':
        return (
          <Suspense fallback={<PageSkeleton />}>
            <DataAssistant data={analysisData} />
          </Suspense>
        );
      default:
        return <DashboardOverview data={analysisData} />;
    }
  };

  return (
    <ErrorBoundary onReset={handleReset}>
      <AppShell
        data={screen === 'dashboard' ? analysisData : null}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
        reducedMotion={reducedMotion}
      >
        <AnimatePresence mode="wait">
          {screen === 'landing' && (
            <PageTransition key="landing" reducedMotion={reducedMotion}>
              <HeroPage onStart={() => setScreen('upload')} reducedMotion={reducedMotion} />
            </PageTransition>
          )}

          {screen === 'upload' && (
            <PageTransition key="upload" reducedMotion={reducedMotion}>
              <UploadPage
                onUpload={handleStartAnalysis}
                isAnalyzing={isAnalyzing}
                stage={stage}
                progress={progress}
                error={error}
                onReset={handleReset}
              />
            </PageTransition>
          )}

          {screen === 'dashboard' && analysisData && (
            <PageTransition key={activeTab} reducedMotion={reducedMotion}>
              <ErrorBoundary onReset={handleReset}>
                {renderActiveTabContent()}
              </ErrorBoundary>
            </PageTransition>
          )}
        </AnimatePresence>
      </AppShell>
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <ToastProvider>
      <DatasetProvider>
        <AppContent />
      </DatasetProvider>
    </ToastProvider>
  );
}

export default App;


import { createContext, useState, type ReactNode } from 'react';
import { uploadFile } from '../api/client';
import type { UploadResponse } from '../types';
import type { AnalysisStage } from '../hooks/useAnalysis';

export interface DatasetContextValue {
  file: File | null;
  isAnalyzing: boolean;
  stage: AnalysisStage;
  progress: number;
  analysisData: UploadResponse | null;
  error: string | null;
  uploadAndAnalyze: (selectedFile: File, targetCol?: string) => Promise<void>;
  resetAnalysis: () => void;
  setAnalysisData: (data: UploadResponse | null) => void;
}

export const DatasetContext = createContext<DatasetContextValue | undefined>(undefined);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAnalysis = () => {
    setFile(null);
    setIsAnalyzing(false);
    setStage('idle');
    setProgress(0);
    setAnalysisData(null);
    setError(null);
  };

  const uploadAndAnalyze = async (selectedFile: File, targetCol?: string) => {
    setFile(selectedFile);
    setIsAnalyzing(true);
    setError(null);
    setProgress(5);
    setStage('parsing');

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 8) + 2;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);

        if (currentProgress > 70) {
          setStage('predicting');
        } else if (currentProgress > 45) {
          setStage('profiling');
        } else if (currentProgress > 20) {
          setStage('cleaning');
        }
      }
    }, 200);

    try {
      const data = await uploadFile(selectedFile, targetCol);
      clearInterval(progressInterval);
      setProgress(100);
      setStage('complete');
      setAnalysisData(data);
      setIsAnalyzing(false);
    } catch (err: any) {
      clearInterval(progressInterval);
      setStage('error');
      setError(err.message || 'An error occurred during dataset analysis.');
      setIsAnalyzing(false);
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        file,
        isAnalyzing,
        stage,
        progress,
        analysisData,
        error,
        uploadAndAnalyze,
        resetAnalysis,
        setAnalysisData,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

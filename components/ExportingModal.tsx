import React from 'react';

interface ExportingModalProps {
  progress: {
    current: number;
    total: number;
  };
}

const ExportingModal: React.FC<ExportingModalProps> = ({ progress }) => {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md text-center p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Generating PDF...</h2>
        <p className="text-slate-600 mb-6">
          Please wait while we prepare your document. Processing page {progress.current} of {progress.total}.
        </p>
        <div className="w-full bg-slate-200 rounded-full h-4 mb-2">
          <div
            className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-sm font-semibold text-slate-700">{percentage}%</p>
      </div>
    </div>
  );
};

export default ExportingModal;
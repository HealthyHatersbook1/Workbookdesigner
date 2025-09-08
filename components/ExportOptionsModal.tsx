import React, { useState } from 'react';
import type { ExportOptions } from '../types';
import { DownloadIcon, FileImageIcon } from './icons';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  currentPageIndex: number;
  totalPages: number;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onExport, currentPageIndex, totalPages }) => {
  const [format, setFormat] = useState<ExportOptions['format']>('pdf');
  const [pageRangeType, setPageRangeType] = useState<'all' | 'current' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
  const [quality, setQuality] = useState<ExportOptions['quality']>('medium');

  if (!isOpen) return null;

  const handleExport = () => {
    let pageRange = 'all';
    if (pageRangeType === 'current') {
      pageRange = `${currentPageIndex + 1}`;
    } else if (pageRangeType === 'custom') {
      if (!customRange.trim()) {
        alert("Please enter a custom page range.");
        return;
      }
      pageRange = customRange;
    }

    onExport({ format, pageRange, quality });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DownloadIcon className="w-6 h-6 text-indigo-500" />
            Advanced Export Options
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setFormat('pdf')} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 ${format === 'pdf' ? 'border-indigo-500 bg-indigo-50' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <DownloadIcon className="w-6 h-6 text-red-600" />
                <span className="font-semibold text-slate-800">PDF</span>
              </button>
              <button onClick={() => setFormat('jpeg')} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 ${format === 'jpeg' ? 'border-indigo-500 bg-indigo-50' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <FileImageIcon className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-slate-800">JPEG</span>
              </button>
              <button onClick={() => setFormat('png')} className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 ${format === 'png' ? 'border-indigo-500 bg-indigo-50' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <FileImageIcon className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-slate-800">PNG</span>
              </button>
            </div>
          </div>

          {/* Page Range */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Page Range</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setPageRangeType('all')} className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm ${pageRangeType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>All Pages ({totalPages})</button>
              <button onClick={() => setPageRangeType('current')} className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm ${pageRangeType === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>Current ({currentPageIndex + 1})</button>
              <div className={`flex-1 rounded-md p-0.5 ${pageRangeType === 'custom' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                 <input
                  type="text"
                  placeholder="e.g., 1-5, 8, 10-12"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  onFocus={() => setPageRangeType('custom')}
                  className="w-full py-2 px-4 rounded-md outline-none text-center font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as ExportOptions['quality'][]).map(q => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`py-2 px-4 rounded-md font-semibold text-sm capitalize ${quality === q ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {quality === 'low' && 'Smallest file size, good for web previews.'}
              {quality === 'medium' && 'Good balance for digital documents.'}
              {quality === 'high' && 'Best quality for professional printing.'}
            </p>
          </div>
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleExport} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center gap-2">
            <DownloadIcon className="w-5 h-5" /> Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
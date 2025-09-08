import React from 'react';
import { ScalingIcon } from './icons';
import type { PublishingPreset } from '../types';

interface AdaptLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdapt: () => void;
  onConfirmChangeDimensionsOnly: () => void;
  fromPreset: PublishingPreset;
  toPreset: PublishingPreset;
}

const AdaptLayoutModal: React.FC<AdaptLayoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmAdapt,
  onConfirmChangeDimensionsOnly,
  fromPreset,
  toPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScalingIcon className="w-6 h-6 text-indigo-500" />
            Adapt Layout to New Preset?
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-slate-600">
            You've changed your publishing preset from{' '}
            <strong className="text-slate-700">{fromPreset.name}</strong> to{' '}
            <strong className="text-slate-700">{toPreset.name}</strong>.
          </p>
          <p className="text-slate-600">
            Would you like to automatically resize and reposition all elements to fit the new dimensions?
            This is recommended when converting between print and digital formats.
          </p>
          <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-500">
            <strong>Note:</strong> This action will modify all pages and can be undone using Ctrl/Cmd+Z.
          </div>
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={onConfirmChangeDimensionsOnly} className="text-indigo-600 font-semibold py-2 px-4 rounded-md hover:bg-indigo-50">
            Just Change Dimensions
          </button>
          <button onClick={onConfirmAdapt} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Yes, Adapt Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdaptLayoutModal;
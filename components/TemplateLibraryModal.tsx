import React from 'react';
import type { Template } from '../types';
import { TEMPLATES } from '../constants/templates';
import { LayoutGridIcon } from './icons';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
}

const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGridIcon className="w-6 h-6 text-indigo-500" />
            Template Library
          </h2>
          <p className="text-slate-600 mt-1">Choose a template to start your new workbook.</p>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map(template => (
              <div key={template.id} className="border bg-slate-50 rounded-lg overflow-hidden flex flex-col group">
                <img 
                  src={template.previewImage} 
                  alt={`${template.name} preview`} 
                  className="w-full h-56 object-cover bg-slate-200"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-slate-800">{template.name}</h3>
                  <p className="text-sm text-slate-600 mt-1 flex-grow">{template.description}</p>
                  <button 
                    onClick={() => onSelectTemplate(template)}
                    className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Select Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibraryModal;
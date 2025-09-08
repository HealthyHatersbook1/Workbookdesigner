import React, { useState } from 'react';
import { ClipboardPasteIcon } from './icons';

interface ImportTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

const ImportTextModal: React.FC<ImportTextModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleImport = () => {
    if (text.trim()) {
      onImport(text);
      setText('');
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ClipboardPasteIcon className="w-6 h-6 text-indigo-500" />
            Smart Text Import
          </h2>
        </div>
        
        <div className="p-6 space-y-4 flex-grow flex flex-col">
          <p className="text-slate-600">Paste your text below. The app will automatically split it by paragraphs and lay it out on the canvas, creating new pages as needed.</p>
          <textarea
            placeholder="Paste your content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none flex-grow resize-none"
          />
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleImport} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center gap-2">
            Import & Format
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportTextModal;
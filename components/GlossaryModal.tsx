
import React, { useState } from 'react';
import type { GlossaryTerm } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  glossary: GlossaryTerm[];
  setGlossary: React.Dispatch<React.SetStateAction<GlossaryTerm[]>>;
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, glossary, setGlossary }) => {
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');

  if (!isOpen) return null;

  const handleAddTerm = () => {
    if (newTerm.trim() && newDefinition.trim()) {
      setGlossary([...glossary, { id: crypto.randomUUID(), term: newTerm, definition: newDefinition }]);
      setNewTerm('');
      setNewDefinition('');
    }
  };

  const handleDeleteTerm = (id: string) => {
    setGlossary(glossary.filter(term => term.id !== id));
  };

  const handleCopyToClipboard = () => {
    const formattedGlossary = glossary
      .map(item => `${item.term}:\n${item.definition}`)
      .join('\n\n');
    navigator.clipboard.writeText(formattedGlossary);
    alert('Formatted glossary copied to clipboard!');
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800">Glossary Creator</h2>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          {glossary.map(item => (
            <div key={item.id} className="p-3 bg-slate-50 rounded-md border flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-700">{item.term}</h3>
                <p className="text-slate-600 mt-1">{item.definition}</p>
              </div>
              <button onClick={() => handleDeleteTerm(item.id)} className="text-red-500 hover:text-red-700 p-1">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
          {glossary.length === 0 && <p className="text-slate-500 text-center py-4">Your glossary is empty. Add a term to get started.</p>}
        </div>

        <div className="p-6 border-t bg-slate-50 space-y-3">
          <h3 className="text-lg font-semibold text-slate-700">Add New Term</h3>
          <input
            type="text"
            placeholder="Term"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <textarea
            placeholder="Definition"
            value={newDefinition}
            onChange={(e) => setNewDefinition(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button onClick={handleAddTerm} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2">
             <PlusIcon className="w-5 h-5"/> Add Term
          </button>
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-white border-t rounded-b-lg">
          {glossary.length > 0 && 
            <button onClick={handleCopyToClipboard} className="bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700">
                Copy Formatted Text
            </button>
          }
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;

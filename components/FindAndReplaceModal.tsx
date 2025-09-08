import React, { useState, useEffect } from 'react';
import { FindIcon } from './icons';

interface FindAndReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string) => void;
  onReplace: (replaceWith: string) => void;
  onReplaceAll: (findQuery: string, replaceWith: string) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
  searchResultsCount: number;
  currentResultIndex: number;
}

const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  onNavigate,
  searchResultsCount,
  currentResultIndex
}) => {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  useEffect(() => {
    // When modal opens, if there's text, auto-focus it
    if (isOpen) {
      const input = document.getElementById('find-input');
      if (input) {
        input.focus();
        (input as HTMLInputElement).select();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFindClick = () => {
    if (findQuery.trim()) {
      onFind(findQuery);
    }
  };
  
  const handleReplaceClick = () => {
      onReplace(replaceQuery);
  };
  
  const handleReplaceAllClick = () => {
      if(findQuery.trim()) {
          onReplaceAll(findQuery, replaceQuery);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FindIcon className="w-6 h-6 text-indigo-500" />
            Find and Replace
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="find-input" className="block text-sm font-medium text-slate-700 mb-1">Find</label>
            <input
              id="find-input"
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindClick()}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="replace-input" className="block text-sm font-medium text-slate-700 mb-1">Replace with</label>
            <input
              id="replace-input"
              type="text"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
            <div className="text-sm text-slate-600">
              {searchResultsCount > 0
                ? `Match ${currentResultIndex + 1} of ${searchResultsCount}`
                : `No results found.`
              }
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => onNavigate('prev')} 
                    disabled={searchResultsCount === 0}
                    className="px-3 py-1 bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50"
                >&lt;</button>
                <button 
                    onClick={() => onNavigate('next')} 
                    disabled={searchResultsCount === 0}
                    className="px-3 py-1 bg-white border rounded-md hover:bg-slate-100 disabled:opacity-50"
                >&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
                onClick={handleReplaceClick}
                disabled={searchResultsCount === 0}
                className="w-full bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 disabled:bg-slate-300"
            >
              Replace
            </button>
             <button
                onClick={handleReplaceAllClick}
                disabled={searchResultsCount === 0}
                className="w-full bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 disabled:bg-slate-300"
            >
              Replace All
            </button>
          </div>

        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">
            Close
          </button>
          <button onClick={handleFindClick} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Find
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindAndReplaceModal;
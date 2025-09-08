import React from 'react';
import type { DataVariable } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface DataPanelProps {
  dataVariables: DataVariable[];
  onAddDataVariable: () => void;
  onUpdateDataVariable: (id: string, updates: Partial<DataVariable>) => void;
  onDeleteDataVariable: (id: string) => void;
}

const DataPanel: React.FC<DataPanelProps> = ({
  dataVariables,
  onAddDataVariable,
  onUpdateDataVariable,
  onDeleteDataVariable,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-slate-800">Data Variables</h3>
        <p className="text-sm text-slate-500 mt-1">
          {/* FIX: Escaped curly braces to render them as text. */}
          Define variables like {'{{'}clientName{'}}'} to use in your text.
        </p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {dataVariables.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            <p>No variables defined.</p>
            <p className="text-sm">Click "Add Variable" to start.</p>
          </div>
        ) : (
          dataVariables.map(variable => (
            <div key={variable.id} className="p-3 bg-slate-50 rounded-md border space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={variable.name}
                  onChange={e => onUpdateDataVariable(variable.id, { name: e.target.value.replace(/\s/g, '') })}
                  placeholder="variableName"
                  className="w-full bg-white p-2 font-mono text-sm text-slate-800 rounded-md border focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button
                  onClick={() => onDeleteDataVariable(variable.id)}
                  title="Delete Variable"
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={variable.value}
                onChange={e => onUpdateDataVariable(variable.id, { value: e.target.value })}
                placeholder="Variable Value"
                rows={2}
                className="w-full bg-white p-2 text-sm text-slate-700 rounded-md border focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={onAddDataVariable}
          className="w-full bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" /> Add Variable
        </button>
      </div>
    </div>
  );
};

export default DataPanel;
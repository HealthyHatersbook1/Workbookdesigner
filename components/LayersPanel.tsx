import React, { useState } from 'react';
import type { WorkbookElement } from '../types';
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, TextIcon, ImageIcon, CheckboxIcon, TextareaIcon, RectangleIcon, TableIcon } from './icons';

interface LayersPanelProps {
  elements: WorkbookElement[];
  selectedElementIds: string[];
  onSelectElementIds: (ids: string[]) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (ids: string[], visible: boolean) => void;
  onToggleLock: (ids: string[], locked: boolean) => void;
}

const ElementIcon: React.FC<{ type: WorkbookElement['type'] }> = ({ type }) => {
    const icons = {
        text: TextIcon,
        image: ImageIcon,
        textarea: TextareaIcon,
        checkbox: CheckboxIcon,
        shape: RectangleIcon,
        table: TableIcon,
    };
    const IconComponent = icons[type] || RectangleIcon;
    return <IconComponent className="w-4 h-4 text-slate-500" />;
};


const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElementIds,
  onReorder,
  onToggleVisibility,
  onToggleLock,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const reversedElements = [...elements].reverse();

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        
        onReorder(draggedIndex, dropIndex);
        setDraggedIndex(null);
    };
    
    const handleSelect = (e: React.MouseEvent, elementId: string) => {
        const isSelected = selectedElementIds.includes(elementId);
        if(e.metaKey || e.ctrlKey) {
            onSelectElementIds(isSelected ? selectedElementIds.filter(id => id !== elementId) : [...selectedElementIds, elementId]);
        } else if (e.shiftKey) {
            const lastSelectedId = selectedElementIds[selectedElementIds.length - 1];
            const lastSelectedIndex = reversedElements.findIndex(el => el.id === lastSelectedId);
            const clickedIndex = reversedElements.findIndex(el => el.id === elementId);
            if (lastSelectedIndex !== -1 && clickedIndex !== -1) {
                const start = Math.min(lastSelectedIndex, clickedIndex);
                const end = Math.max(lastSelectedIndex, clickedIndex);
                const idsToAdd = reversedElements.slice(start, end + 1).map(el => el.id);
                onSelectElementIds([...new Set([...selectedElementIds, ...idsToAdd])]);
            } else {
                onSelectElementIds([elementId]);
            }
        } else {
            onSelectElementIds([elementId]);
        }
    };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-slate-800">Layers</h3>
        <p className="text-sm text-slate-500 mt-1">Manage element order, visibility, and locks.</p>
      </div>

      <div className="flex-grow overflow-y-auto">
        {reversedElements.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            <p>No elements on this page.</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {reversedElements.map((element, index) => {
              const isSelected = selectedElementIds.includes(element.id);
              return (
                <div
                  key={element.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={(e) => handleSelect(e, element.id)}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100' : 'hover:bg-slate-100'} ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <ElementIcon type={element.type} />
                  <span className="flex-grow text-sm text-slate-700 truncate">{element.content.substring(0, 20) || element.type}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleLock([element.id], !element.locked); }}
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title={element.locked ? 'Unlock' : 'Lock'}
                  >
                    {element.locked ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility([element.id], !element.visible); }}
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title={element.visible ? 'Hide' : 'Show'}
                  >
                    {element.visible ? <EyeIcon className="w-4 h-4" /> : <EyeOffIcon className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
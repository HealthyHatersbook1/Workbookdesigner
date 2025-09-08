import React, { useState } from 'react';
import type { ColorPaletteItem, TextStyle, WorkbookElementStyle } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface StylesPanelProps {
  colorPalette: ColorPaletteItem[];
  textStyles: TextStyle[];
  onUpdateColorPalette: (id: string, updates: Partial<ColorPaletteItem>) => void;
  onAddColorToPalette: () => void;
  onDeleteColorFromPalette: (id: string) => void;
  onUpdateTextStyle: (id: string, updates: Partial<TextStyle>) => void;
  onAddTextStyle: () => void;
  onDeleteTextStyle: (id: string) => void;
}

const StylesPanel: React.FC<StylesPanelProps> = ({
  colorPalette,
  textStyles,
  onUpdateColorPalette,
  onAddColorToPalette,
  onDeleteColorFromPalette,
  onUpdateTextStyle,
  onAddTextStyle,
  onDeleteTextStyle,
}) => {

  const handleColorChange = (id: string, color: string) => {
    // Basic validation for hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        onUpdateColorPalette(id, { color });
    }
  };


  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-slate-800">Project Styles</h3>
        <p className="text-sm text-slate-500 mt-1">Manage reusable colors and text styles for your workbook.</p>
      </div>

      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {/* Color Palette Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Color Palette</h4>
            <button onClick={onAddColorToPalette} title="Add New Color" className="p-1 text-indigo-600 hover:text-indigo-800"><PlusIcon className="w-5 h-5"/></button>
          </div>
          <div className="space-y-2">
            {colorPalette.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                <input
                  type="color"
                  value={item.color}
                  onChange={e => handleColorChange(item.id, e.target.value)}
                  className="w-8 h-8 rounded border-slate-300 overflow-hidden"
                  title="Change color"
                />
                <input
                  type="text"
                  value={item.name}
                  onChange={e => onUpdateColorPalette(item.id, { name: e.target.value })}
                  className="w-full bg-transparent p-1 font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-md outline-none"
                />
                <button onClick={() => onDeleteColorFromPalette(item.id)} title="Delete Color" className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Text Styles Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Text Styles</h4>
            <button onClick={onAddTextStyle} title="Add New Text Style" className="p-1 text-indigo-600 hover:text-indigo-800"><PlusIcon className="w-5 h-5"/></button>
          </div>
          <div className="space-y-2">
            {textStyles.map(item => (
              <div key={item.id} className="p-2 bg-slate-50 rounded-md">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={item.name}
                        onChange={e => onUpdateTextStyle(item.id, { name: e.target.value })}
                        className="w-full bg-transparent p-1 font-medium text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-md outline-none"
                    />
                    <button onClick={() => onDeleteTextStyle(item.id)} title="Delete Text Style" className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
                </div>
                <div 
                    className="p-2 mt-1 truncate"
                    style={{ ...item.style }}
                >
                  Preview Text
                </div>
                 <div className="text-xs text-slate-400 p-1">
                    {item.style.fontFamily?.split(',')[0].replace(/'/g, '')}, {item.style.fontSize}px
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylesPanel;
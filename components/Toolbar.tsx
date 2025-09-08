import React, { useState } from 'react';
import type { PublishingPreset, Page, WorkbookElement, MasterPage, BookType, PageViewMode } from '../types';
import { PUBLISHING_PRESETS } from '../constants';
import { TextIcon, ImageIcon, BookIcon, SparklesIcon, PlusIcon, ListIcon, ClipboardPasteIcon, UndoIcon, RedoIcon, ShieldCheckIcon, LayoutTemplateIcon, TextareaIcon, CheckboxIcon, DownloadIcon, LayoutGridIcon, RectangleIcon, CircleIcon, LineIcon, TableIcon, LayersIcon, ListOrderedIcon, MegaphoneIcon, FindIcon, SaveIcon, UploadCloudIcon, RulerIcon, HomeIcon, HelpCircleIcon } from './icons';

interface ToolbarProps {
  projectName: string;
  onRenameProject: (newName: string) => void;
  onNavigateHome: () => void;
  onAddElement: (type: WorkbookElement['type'] | 'rectangle' | 'ellipse' | 'line') => void;
  // Page mode
  pages: Page[];
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  onAddPage: () => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  // Master mode
  masterPages: MasterPage[];
  currentMasterPageIndex: number,
  setCurrentMasterPageIndex: (index: number) => void;
  onAddMasterPage: () => void;
  onReorderMasterPages: (fromIndex: number, toIndex: number) => void;
  // General
  editMode: 'pages' | 'masters';
  setEditMode: (mode: 'pages' | 'masters') => void;
  pageViewMode: PageViewMode;
  setPageViewMode: (mode: PageViewMode) => void;
  publishingPreset: PublishingPreset;
  onRequestPresetChange: (size: PublishingPreset) => void;
  bookType: BookType;
  setBookType: (bookType: BookType) => void;
  calculatedMargins: { top: number, bottom: number, inside: number, outside: number, bleed: number };
  onOpenGlossary: () => void;
  // FIX: Corrected typo from onOpenAIGenerATOR to onOpenAIGenerator
  onOpenAIGenerator: () => void;
  onOpenAIFormatter: () => void;
  onOpenTextImporter: () => void;
  onOpenTemplateLibrary: () => void;
  onOpenMarketingModal: () => void;
  onOpenFindAndReplace: () => void;
  onOpenHelpModal: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showSafetyLines: boolean;
  setShowSafetyLines: (show: boolean) => void;
  showRulers: boolean;
  setShowRulers: (show: boolean) => void;
  onOpenExportOptions: () => void;
  onGenerateOrUpdateToc: () => void;
  hasTocPage: boolean;
  onExportProject: () => void;
  onImportProject: () => void;
}

const ToolbarButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string; disabled?: boolean; }> = ({ onClick, children, label, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex flex-col items-center justify-center w-full h-20 bg-slate-200 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg transition-colors duration-150 text-slate-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    title={label}
  >
    {children}
    <span className="text-xs mt-1 font-medium">{label}</span>
  </button>
);

const PageList: React.FC<{
    items: (Page | MasterPage)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    viewMode: PageViewMode;
    onReorder: (from: number, to: number) => void;
}> = ({ items, selectedIndex, onSelect, viewMode, onReorder }) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTarget, setDropTarget] = useState<{index: number, position: 'before' | 'after'} | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        if (viewMode === 'list') {
            const midY = rect.top + rect.height / 2;
            setDropTarget({ index, position: e.clientY > midY ? 'after' : 'before' });
        } else {
            const midX = rect.left + rect.width / 2;
            setDropTarget({ index, position: e.clientX > midX ? 'after' : 'before' });
        }
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedIndex !== null && dropTarget !== null) {
            let toIndex = dropTarget.index;
            if(dropTarget.position === 'after') {
                toIndex += 1;
            }
            if (draggedIndex < toIndex) {
                toIndex -= 1;
            }
            if (draggedIndex !== toIndex) {
                onReorder(draggedIndex, toIndex);
            }
        }
        setDraggedIndex(null);
        setDropTarget(null);
    };
    
    const containerClasses = viewMode === 'list' 
        ? 'space-y-1'
        : 'grid grid-cols-3 gap-2';

    return (
        <div onDrop={handleDrop} onDragLeave={handleDragLeave} onDragOver={(e) => e.preventDefault()} className={containerClasses}>
            {items.map((item, index) => {
                const isSelected = selectedIndex === index;
                const showDropBefore = dropTarget?.index === index && dropTarget.position === 'before';
                const showDropAfter = dropTarget?.index === index && dropTarget.position === 'after';
                
                return (
                    <div 
                        key={item.id} 
                        className="relative"
                        onDragOver={(e) => handleDragOver(e, index)}
                    >
                        {showDropBefore && <div className={`absolute z-10 ${viewMode === 'list' ? 'top-[-2px] left-0 right-0 h-1' : 'top-0 left-[-2px] bottom-0 w-1'} bg-indigo-500 rounded-full`} />}
                        <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onClick={() => onSelect(index)}
                            className={`cursor-pointer p-2 rounded-md border-2 transition-all ${ isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-slate-100 hover:bg-slate-200'}`}
                        >
                            <p className={`font-medium truncate text-sm ${ isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>
                                {index + 1}. {item.title}
                            </p>
                        </div>
                        {showDropAfter && <div className={`absolute z-10 ${viewMode === 'list' ? 'bottom-[-2px] left-0 right-0 h-1' : 'top-0 right-[-2px] bottom-0 w-1'} bg-indigo-500 rounded-full`} />}
                    </div>
                );
            })}
        </div>
    );
};


const Toolbar: React.FC<ToolbarProps> = ({
  projectName,
  onRenameProject,
  onNavigateHome,
  onAddElement,
  pages,
  currentPageIndex,
  setCurrentPageIndex,
  onAddPage,
  onReorderPages,
  masterPages,
  currentMasterPageIndex,
  setCurrentMasterPageIndex,
  onAddMasterPage,
  onReorderMasterPages,
  editMode,
  setEditMode,
  pageViewMode,
  setPageViewMode,
  publishingPreset,
  onRequestPresetChange,
  bookType,
  setBookType,
  calculatedMargins,
  onOpenGlossary,
  onOpenAIGenerator,
  onOpenAIFormatter,
  onOpenTextImporter,
  onOpenTemplateLibrary,
  onOpenMarketingModal,
  onOpenFindAndReplace,
  onOpenHelpModal,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showSafetyLines,
  setShowSafetyLines,
  showRulers,
  setShowRulers,
  onOpenExportOptions,
  onGenerateOrUpdateToc,
  hasTocPage,
  onExportProject,
  onImportProject,
}) => {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = PUBLISHING_PRESETS.find(size => size.name === e.target.value);
    if (selectedPreset) {
      onRequestPresetChange(selectedPreset);
    }
  };

  const isPageMode = editMode === 'pages';

  return (
    <div className="w-80 bg-white h-full shadow-md flex flex-col p-4 space-y-6 overflow-y-auto">
      <div className="text-center border-b pb-4">
        <input 
            type="text"
            value={projectName}
            onChange={(e) => onRenameProject(e.target.value)}
            className="text-xl font-bold text-slate-800 text-center w-full p-1 rounded-md hover:bg-slate-100 focus:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
      
      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Project</h2>
        <div className="grid grid-cols-4 gap-3">
          <ToolbarButton onClick={onNavigateHome} label="Home"><HomeIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onImportProject} label="Import"><UploadCloudIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onExportProject} label="Export"><SaveIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onOpenHelpModal} label="Help"><HelpCircleIcon className="w-6 h-6" /></ToolbarButton>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">View</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setEditMode('pages')} className={`py-3 px-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${isPageMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
            <ListIcon className="w-5 h-5" /> Edit Pages
          </button>
          <button onClick={() => setEditMode('masters')} className={`py-3 px-4 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${!isPageMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}>
            <LayersIcon className="w-5 h-5" /> Edit Masters
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">History</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToolbarButton onClick={onUndo} label="Undo" disabled={!canUndo}><UndoIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onRedo} label="Redo" disabled={!canRedo}><RedoIcon className="w-6 h-6" /></ToolbarButton>
        </div>
      </div>

       <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Editing</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToolbarButton onClick={onOpenFindAndReplace} label="Find & Replace"><FindIcon className="w-6 h-6" /></ToolbarButton>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Content Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToolbarButton onClick={() => onAddElement('text')} label="Add Text"><TextIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('image')} label="Add Image"><ImageIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('textarea')} label="Text Area"><TextareaIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('checkbox')} label="Checkbox"><CheckboxIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('rectangle')} label="Rectangle"><RectangleIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('ellipse')} label="Ellipse"><CircleIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('line')} label="Line"><LineIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={() => onAddElement('table')} label="Table"><TableIcon className="w-6 h-6" /></ToolbarButton>
        </div>
      </div>

       <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">AI &amp; Import</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToolbarButton onClick={onOpenTemplateLibrary} label="Templates"><LayoutGridIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onOpenTextImporter} label="Import Text"><ClipboardPasteIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onOpenAIGenerator} label="AI Helper"><SparklesIcon className="w-6 h-6" /></ToolbarButton>
           <ToolbarButton onClick={onOpenAIFormatter} label="AI Design"><LayoutTemplateIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onOpenMarketingModal} label="Marketing AI"><MegaphoneIcon className="w-6 h-6" /></ToolbarButton>
          <ToolbarButton onClick={onOpenGlossary} label="Glossary"><BookIcon className="w-6 h-6" /></ToolbarButton>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{isPageMode ? 'Pages' : 'Master Pages'}</h2>
            <div className="flex gap-1">
                <button title="List View" onClick={() => setPageViewMode('list')} className={`p-1.5 rounded-md ${pageViewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                    <ListIcon className="w-4 h-4" />
                </button>
                <button title="Grid View" onClick={() => setPageViewMode('grid')} className={`p-1.5 rounded-md ${pageViewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}>
                    <LayoutGridIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="max-h-48 overflow-y-auto pr-2">
            <PageList 
                items={isPageMode ? pages : masterPages}
                selectedIndex={isPageMode ? currentPageIndex : currentMasterPageIndex}
                onSelect={isPageMode ? setCurrentPageIndex : setCurrentMasterPageIndex}
                viewMode={pageViewMode}
                onReorder={isPageMode ? onReorderPages : onReorderMasterPages}
            />
        </div>
        <button onClick={isPageMode ? onAddPage : onAddMasterPage} className="w-full mt-2 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 flex items-center justify-center gap-2">
          <PlusIcon className="w-5 h-5"/> {isPageMode ? 'Add Page' : 'Add Master'}
        </button>
      </div>
      
      <div>
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Layout &amp; Export</h2>
        <div className="space-y-3">
           <div>
            <label htmlFor="export-preset" className="block text-sm font-medium text-slate-700 mb-1">Publishing Preset</label>
            <select
              id="export-preset"
              value={publishingPreset.name}
              onChange={handlePresetChange}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {PUBLISHING_PRESETS.map(size => (
                <option key={size.name} value={size.name}>{size.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="book-type" className="block text-sm font-medium text-slate-700 mb-1">Book Type</label>
            <select
              id="book-type"
              value={bookType}
              onChange={(e) => setBookType(e.target.value as BookType)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="paperback">Paperback</option>
              {publishingPreset.bookTypes.hardcover && <option value="hardcover">Hardcover</option>}
            </select>
          </div>
          <div className="mt-2 p-2 bg-slate-50 rounded-md text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">Calculated Specs:</div>
            <div><strong>Size:</strong> {publishingPreset.width} x {publishingPreset.height} px</div>
            <div><strong>Bleed:</strong> {calculatedMargins.bleed} px</div>
            <div className="grid grid-cols-2">
              <div><strong>Top:</strong> {calculatedMargins.top} px</div>
              <div><strong>Bottom:</strong> {calculatedMargins.bottom} px</div>
              <div><strong>Outside:</strong> {calculatedMargins.outside} px</div>
              <div><strong>Inside:</strong> {calculatedMargins.inside} px</div>
            </div>
          </div>
          <button onClick={onGenerateOrUpdateToc} className="w-full bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300 flex items-center justify-center gap-2" disabled={!isPageMode}>
            <ListOrderedIcon className="w-5 h-5"/> {hasTocPage ? 'Update ToC' : 'Generate ToC'}
          </button>
           <button 
            onClick={() => setShowSafetyLines(!showSafetyLines)} 
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${showSafetyLines ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
          >
            <ShieldCheckIcon className="w-5 h-5"/> Toggle Margin Guides
          </button>
           <button 
            onClick={() => setShowRulers(!showRulers)} 
            className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${showRulers ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
          >
            <RulerIcon className="w-5 h-5"/> Toggle Rulers & Guides
          </button>
          <button onClick={onOpenExportOptions} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2">
            <DownloadIcon className="w-5 h-5"/> Export...
          </button>
        </div>
      </div>

    </div>
  );
};

export default Toolbar;
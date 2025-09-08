import React, { useRef, useState, useMemo } from 'react';
import type { Page, WorkbookElement, WorkbookElementStyle, Alignment, MasterPage, ColorPaletteItem, TextStyle } from '../types';
import StockImageSearch from './StockImageSearch';
import { 
    BringForwardIcon, SendBackwardIcon, BringToFrontIcon, SendToBackIcon, 
    UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
    AlignLeftEdgesIcon, AlignHorizontalCenterIcon, AlignRightEdgesIcon,
    AlignTopEdgesIcon, AlignVerticalMiddleIcon, AlignBottomEdgesIcon,
    UploadCloudIcon, LinkIcon, ImageIcon, GroupIcon, UngroupIcon, LockIcon, UnlockIcon, Link2Icon, Unlink2Icon
} from './icons';
import { FONT_FACES } from '../constants';


interface PropertiesPanelProps {
  selectedElements: WorkbookElement[];
  onUpdateElement: (id: string, updates: Partial<WorkbookElement>) => void;
  onUpdateElements: (updates: { id: string, updates: Partial<WorkbookElement> }[]) => void;
  onDeleteElements: () => void;
  onLayerAction: (id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  onToggleLock: (ids: string[], locked: boolean) => void;
  onAlignElements: (alignment: Alignment) => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
  onAddAsset: (url: string) => void;
  // Page mode
  currentPage: Page | null;
  onUpdatePage: (id: string, updates: Partial<Page>) => void;
  // Master mode
  currentMasterPage: MasterPage | null;
  onUpdateMasterPage: (id: string, updates: Partial<MasterPage>) => void;
  masterPages: MasterPage[];
  // General
  editMode: 'pages' | 'masters';
  // Styles
  colorPalette: ColorPaletteItem[];
  textStyles: TextStyle[];
  // Text Flow
  onStartLinkFlow: (fromElementId: string) => void;
  onBreakLinkFlow: (elementId: string) => void;
}

const PropertyInput: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => (
    <div className="p-2">
        <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
        {children}
    </div>
);

const ColorPickerWithPalette: React.FC<{ value: string; onChange: (color: string) => void; palette: ColorPaletteItem[] }> = ({ value, onChange, palette }) => (
    <div>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-1 border rounded-md bg-white h-10"/>
        <div className="grid grid-cols-5 gap-2 mt-2">
            {palette.map(item => (
                <button
                    key={item.id}
                    title={item.name}
                    onClick={() => onChange(item.color)}
                    className={`w-full h-8 rounded border-2 ${item.color === value ? 'border-indigo-500' : 'border-transparent'}`}
                    style={{ backgroundColor: item.color }}
                />
            ))}
        </div>
    </div>
);


const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; label: string; disabled?: boolean }> = ({ onClick, children, label, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center p-2 bg-slate-100 hover:bg-indigo-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-md transition-colors text-slate-700 w-full"
      title={label}
    >
      {children}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
    selectedElements, 
    onUpdateElement,
    onUpdateElements, 
    onDeleteElements, 
    onLayerAction,
    onToggleLock,
    onAlignElements,
    onGroupElements,
    onUngroupElements,
    onAddAsset,
    currentPage,
    onUpdatePage,
    currentMasterPage,
    onUpdateMasterPage,
    masterPages,
    editMode,
    colorPalette,
    textStyles,
    onStartLinkFlow,
    onBreakLinkFlow,
}) => {
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const [imageSourceTab, setImageSourceTab] = useState<'upload' | 'stock' | 'url'>('stock');

    const handleStyleChange = (styleUpdates: Partial<WorkbookElementStyle>) => {
        if (selectedElements.length > 0) {
            const updates = selectedElements.map(el => ({
                id: el.id,
                updates: {
                    style: { ...el.style, ...styleUpdates }
                }
            }));
            onUpdateElements(updates);
        }
    };
    
    const handleTextStyleChange = (textStyleId: string | null) => {
        if (selectedElements.length > 0) {
            const updates = selectedElements.map(el => ({
                id: el.id,
                updates: { textStyleId }
            }));
            onUpdateElements(updates);
        }
    };

    const handleImageUrlChange = (url: string) => {
        if (selectedElements.length === 1) {
            onUpdateElement(selectedElements[0].id, { content: url });
            onAddAsset(url);
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleImageUrlChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderPageProperties = () => {
        if (!currentPage) return null;
        return (
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Page Properties</h3>
                <div className="space-y-4">
                    <PropertyInput label="Page Title">
                       <input
                            type="text"
                            value={currentPage.title}
                            onChange={(e) => onUpdatePage(currentPage.id, { title: e.target.value })}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </PropertyInput>
                    <PropertyInput label="Master Page">
                       <select
                            value={currentPage.masterPageId || 'none'}
                            onChange={(e) => onUpdatePage(currentPage.id, { masterPageId: e.target.value === 'none' ? null : e.target.value })}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="none">None</option>
                            {masterPages.map(mp => (
                                <option key={mp.id} value={mp.id}>{mp.title}</option>
                            ))}
                        </select>
                    </PropertyInput>
                </div>
            </div>
        )
    };
    
    const renderMasterPageProperties = () => {
        if (!currentMasterPage) return null;
        return (
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Master Page Properties</h3>
                <div className="space-y-4">
                    <PropertyInput label="Master Page Title">
                       <input
                            type="text"
                            value={currentMasterPage.title}
                            onChange={(e) => onUpdateMasterPage(currentMasterPage.id, { title: e.target.value })}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </PropertyInput>
                </div>
            </div>
        )
    }

    const renderMultiSelectProperties = () => {
        const canGroup = useMemo(() => {
            if (selectedElements.length < 2) return false;
            // Can group if elements from different or no groups are selected.
            const groupIds = new Set(selectedElements.map(el => el.groupId).filter(Boolean));
            return groupIds.size !== 1 || selectedElements.some(el => !el.groupId);
        }, [selectedElements]);

        const canUngroup = useMemo(() => {
            if (selectedElements.length === 0) return false;
            const firstGroupId = selectedElements[0].groupId;
            return !!firstGroupId && selectedElements.every(el => el.groupId === firstGroupId);
        }, [selectedElements]);

        return (
            <div className="p-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{selectedElements.length} Elements Selected</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Grouping</h4>
                         <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg">
                            <ActionButton onClick={onGroupElements} disabled={!canGroup} label="Group"><GroupIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={onUngroupElements} disabled={!canUngroup} label="Ungroup"><UngroupIcon className="w-5 h-5"/></ActionButton>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Alignment</h4>
                        <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg">
                            <ActionButton onClick={() => onAlignElements('left')} label="Align Left"><AlignLeftEdgesIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={() => onAlignElements('center')} label="Center Horiz."><AlignHorizontalCenterIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={() => onAlignElements('right')} label="Align Right"><AlignRightEdgesIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={() => onAlignElements('top')} label="Align Top"><AlignTopEdgesIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={() => onAlignElements('middle')} label="Middle Vert."><AlignVerticalMiddleIcon className="w-5 h-5"/></ActionButton>
                            <ActionButton onClick={() => onAlignElements('bottom')} label="Align Bottom"><AlignBottomEdgesIcon className="w-5 h-5"/></ActionButton>
                        </div>
                    </div>
                    <button onClick={onDeleteElements} className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">
                        Delete {selectedElements.length} Elements
                    </button>
                </div>
            </div>
        );
    };

    const renderElementProperties = (selectedElement: WorkbookElement) => {
        const elementsList = editMode === 'pages' ? currentPage?.elements : currentMasterPage?.elements;
        if (!elementsList) return null;
        
        const elementIndex = elementsList.findIndex(el => el.id === selectedElement.id);
        const isAtFront = elementIndex === elementsList.length - 1;
        const isAtBack = elementIndex === 0;

        const appliedTextStyle = textStyles.find(ts => ts.id === selectedElement.textStyleId);
        const finalStyle = { ...appliedTextStyle?.style, ...selectedElement.style };
        
        return (
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 capitalize">{selectedElement.type} Properties</h3>
                
                {selectedElement.type === 'text' && (
                  <>
                    <PropertyInput label="Content">
                        <textarea
                            value={selectedElement.content}
                            onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                            rows={4}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </PropertyInput>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Text Flow</h4>
                      <div className="p-2 bg-slate-50 rounded-lg">
                          {selectedElement.nextElementId || selectedElement.previousElementId ? (
                              <button onClick={() => onBreakLinkFlow(selectedElement.id)} className="w-full bg-white text-red-600 py-2 px-4 rounded-md hover:bg-red-50 border border-red-200 flex items-center justify-center gap-2">
                                  <Unlink2Icon className="w-5 h-5"/> Unlink Text Flow
                              </button>
                          ) : (
                              <button onClick={() => onStartLinkFlow(selectedElement.id)} className="w-full bg-white text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-50 border border-indigo-200 flex items-center justify-center gap-2">
                                  <Link2Icon className="w-5 h-5"/> Link to next box...
                              </button>
                          )}
                      </div>
                    </div>
                  </>
                )}
                 {selectedElement.type === 'textarea' && (
                    <PropertyInput label="Placeholder Text">
                        <textarea
                            value={selectedElement.content}
                            onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                            rows={4}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </PropertyInput>
                )}
                {selectedElement.type === 'checkbox' && (
                     <div className="space-y-3">
                        <PropertyInput label="Label">
                            <input
                                type="text"
                                value={selectedElement.content}
                                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                                className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </PropertyInput>
                        <label className="flex items-center gap-2 cursor-pointer p-2">
                            <input
                                type="checkbox"
                                checked={selectedElement.checked}
                                onChange={(e) => onUpdateElement(selectedElement.id, { checked: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Checked</span>
                        </label>
                    </div>
                )}
                {selectedElement.type === 'image' && (
                    <div>
                         <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Image Source</h4>
                         <div className="bg-slate-50 rounded-lg p-1">
                            <div className="grid grid-cols-3 gap-1 mb-2">
                                 <button onClick={() => setImageSourceTab('stock')} className={`py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${imageSourceTab === 'stock' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100'}`}>
                                    <ImageIcon className="w-4 h-4" /> Stock
                                </button>
                                <button onClick={() => setImageSourceTab('upload')} className={`py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${imageSourceTab === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100'}`}>
                                    <UploadCloudIcon className="w-4 h-4" /> Upload
                                </button>
                                 <button onClick={() => setImageSourceTab('url')} className={`py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${imageSourceTab === 'url' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100'}`}>
                                    <LinkIcon className="w-4 h-4" /> URL
                                </button>
                            </div>
                            <div className="p-2">
                                {imageSourceTab === 'stock' && (
                                    <StockImageSearch onSelectImage={handleImageUrlChange} />
                                )}
                                {imageSourceTab === 'upload' && (
                                    <div>
                                        <input type="file" ref={imageUploadRef} onChange={handleImageUpload} accept="image/*" className="hidden" aria-hidden="true" />
                                        <button onClick={() => imageUploadRef.current?.click()} className="w-full bg-white text-indigo-700 py-2 px-4 rounded-md hover:bg-indigo-50 border border-indigo-200">
                                            Choose Image from Device
                                        </button>
                                    </div>
                                )}
                                {imageSourceTab === 'url' && (
                                    <PropertyInput label="Image URL">
                                        <input type="text" value={selectedElement.content} onChange={(e) => handleImageUrlChange(e.target.value)} className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                    </PropertyInput>
                                )}
                            </div>
                         </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <PropertyInput label="X"><input type="number" value={Math.round(selectedElement.x)} onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                    <PropertyInput label="Y"><input type="number" value={Math.round(selectedElement.y)} onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                    <PropertyInput label="Width"><input type="number" value={Math.round(selectedElement.width)} onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                    <PropertyInput label="Height"><input type="number" value={Math.round(selectedElement.height)} onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                </div>
                
                 <PropertyInput label="Rotation">
                    <div className="flex items-center">
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            value={selectedElement.rotation}
                            onChange={(e) => onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                            type="number"
                            value={Math.round(selectedElement.rotation)}
                            onChange={(e) => onUpdateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                            className="w-20 ml-3 p-2 border rounded-md bg-white text-center"
                        />
                    </div>
                </PropertyInput>

                {(selectedElement.type === 'text' || selectedElement.type === 'image') && (
                    <PropertyInput label="Link URL">
                        <input
                            type="text"
                            placeholder="https://example.com"
                            value={selectedElement.link || ''}
                            onChange={(e) => onUpdateElement(selectedElement.id, { link: e.target.value })}
                            className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </PropertyInput>
                )}

                <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Arrange</h4>
                    <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 rounded-lg">
                        <ActionButton onClick={() => onLayerAction(selectedElement.id, 'forward')} disabled={isAtFront} label="Forward">
                            <BringForwardIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton onClick={() => onLayerAction(selectedElement.id, 'backward')} disabled={isAtBack} label="Backward">
                            <SendBackwardIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton onClick={() => onLayerAction(selectedElement.id, 'front')} disabled={isAtFront} label="Front">
                            <BringToFrontIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton onClick={() => onLayerAction(selectedElement.id, 'back')} disabled={isAtBack} label="Back">
                            <SendToBackIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton 
                            onClick={() => onToggleLock([selectedElement.id], !selectedElement.locked)} 
                            label={selectedElement.locked ? 'Unlock' : 'Lock'}
                        >
                            {selectedElement.locked ? <UnlockIcon className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
                        </ActionButton>
                    </div>
                </div>
                
                {selectedElement.type === 'shape' && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Shape Styles</h4>
                        <div className="space-y-3 p-2 bg-slate-50 rounded-lg">
                            {selectedElement.shapeType !== 'line' && (
                                <PropertyInput label="Fill Color">
                                    <ColorPickerWithPalette value={finalStyle.fillColor || '#ffffff'} onChange={(color) => handleStyleChange({ fillColor: color })} palette={colorPalette} />
                                </PropertyInput>
                            )}
                            <PropertyInput label="Stroke Color">
                                <ColorPickerWithPalette value={finalStyle.strokeColor || '#000000'} onChange={(color) => handleStyleChange({ strokeColor: color })} palette={colorPalette} />
                            </PropertyInput>
                            <PropertyInput label="Stroke Width">
                                <input type="number" min="0" value={finalStyle.strokeWidth || 0} onChange={(e) => handleStyleChange({ strokeWidth: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/>
                            </PropertyInput>
                            <PropertyInput label="Stroke Style">
                                <select value={finalStyle.strokeDasharray || 'none'} onChange={e => handleStyleChange({ strokeDasharray: e.target.value })} className="w-full p-2 border rounded-md bg-white">
                                    <option value="none">Solid</option>
                                    <option value="5, 5">Dashed</option>
                                    <option value="2, 3">Dotted</option>
                                </select>
                            </PropertyInput>
                        </div>
                    </div>
                )}

                {selectedElement.type === 'table' && (
                    <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Table Properties</h4>
                        <div className="space-y-3 p-2 bg-slate-50 rounded-lg">
                           <div className="grid grid-cols-2 gap-3">
                            <PropertyInput label="Rows">
                                <input type="number" min="1" value={selectedElement.rows || 1} onChange={(e) => onUpdateElement(selectedElement.id, { rows: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/>
                            </PropertyInput>
                            <PropertyInput label="Columns">
                                <input type="number" min="1" value={selectedElement.cols || 1} onChange={(e) => onUpdateElement(selectedElement.id, { cols: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/>
                            </PropertyInput>
                            </div>
                            <PropertyInput label="Border Color">
                                 <ColorPickerWithPalette value={finalStyle.strokeColor || '#000000'} onChange={(color) => handleStyleChange({ strokeColor: color })} palette={colorPalette} />
                            </PropertyInput>
                            <PropertyInput label="Border Width">
                                <input type="number" min="0" value={finalStyle.strokeWidth || 0} onChange={(e) => handleStyleChange({ strokeWidth: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/>
                            </PropertyInput>
                        </div>
                    </div>
                )}


                {(selectedElement.type === 'text' || selectedElement.type === 'textarea' || selectedElement.type === 'checkbox') && (
                   <div>
                        <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider p-2">Formatting</h4>
                        <div className="space-y-3 p-2 bg-slate-50 rounded-lg">
                             <PropertyInput label="Text Style">
                                <select
                                    value={selectedElement.textStyleId || 'none'}
                                    onChange={(e) => handleTextStyleChange(e.target.value === 'none' ? null : e.target.value)}
                                    className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="none">None (Custom)</option>
                                    {textStyles.map(ts => (
                                        <option key={ts.id} value={ts.id}>{ts.name}</option>
                                    ))}
                                </select>
                             </PropertyInput>
                             <PropertyInput label="Font Family">
                                <select
                                    value={finalStyle.fontFamily}
                                    onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
                                    className="w-full p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    style={{ fontFamily: finalStyle.fontFamily }}
                                >
                                    {FONT_FACES.map(font => (
                                        <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.name}
                                        </option>
                                    ))}
                                </select>
                            </PropertyInput>
                            <div className="grid grid-cols-2 gap-3">
                                <PropertyInput label="Font Size"><input type="number" value={finalStyle.fontSize} onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                                <PropertyInput label="Color">
                                    <ColorPickerWithPalette value={finalStyle.color || '#000000'} onChange={(color) => handleStyleChange({ color })} palette={colorPalette} />
                                </PropertyInput>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <PropertyInput label="Line Height"><input type="number" step="0.1" value={finalStyle.lineHeight} onChange={(e) => handleStyleChange({ lineHeight: parseFloat(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                                <PropertyInput label="Letter Spacing"><input type="number" step="0.1" value={finalStyle.letterSpacing} onChange={(e) => handleStyleChange({ letterSpacing: parseFloat(e.target.value) })} className="w-full p-2 border rounded-md bg-white"/></PropertyInput>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <button title="Bold" onClick={() => handleStyleChange({ fontWeight: finalStyle.fontWeight === 'bold' ? 'normal' : 'bold'})} className={`p-2 rounded border font-bold ${finalStyle.fontWeight === 'bold' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>B</button>
                                <button title="Italic" onClick={() => handleStyleChange({ fontStyle: finalStyle.fontStyle === 'italic' ? 'normal' : 'italic'})} className={`p-2 rounded border italic ${finalStyle.fontStyle === 'italic' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>I</button>
                                <button title="Underline" onClick={() => handleStyleChange({ underline: !finalStyle.underline })} className={`p-2 rounded border flex justify-center items-center ${finalStyle.underline ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                    <UnderlineIcon className="w-5 h-5" />
                                </button>
                                <button title="Strikethrough" onClick={() => handleStyleChange({ strikethrough: !finalStyle.strikethrough })} className={`p-2 rounded border flex justify-center items-center ${finalStyle.strikethrough ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                    <StrikethroughIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button title="Align Left" onClick={() => handleStyleChange({ textAlign: 'left' })} className={`p-2 rounded border flex justify-center items-center ${finalStyle.textAlign === 'left' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                    <AlignLeftIcon className="w-5 h-5" />
                                </button>
                                <button title="Align Center" onClick={() => handleStyleChange({ textAlign: 'center' })} className={`p-2 rounded border flex justify-center items-center ${finalStyle.textAlign === 'center' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                    <AlignCenterIcon className="w-5 h-5" />
                                </button>
                                <button title="Align Right" onClick={() => handleStyleChange({ textAlign: 'right' })} className={`p-2 rounded border flex justify-center items-center ${finalStyle.textAlign === 'right' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                    <AlignRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                            {selectedElement.type === 'text' && (
                                <label className="flex items-center gap-2 cursor-pointer p-2">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedElement.isTocHeading}
                                        onChange={(e) => onUpdateElement(selectedElement.id, { isTocHeading: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Include in Table of Contents</span>
                                </label>
                            )}
                        </div>
                    </div>
                )}
                 <button onClick={onDeleteElements} className="w-full mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">Delete Element</button>
            </div>
        );
    };

    const renderContent = () => {
        if (selectedElements.length === 0) {
            return editMode === 'pages' ? renderPageProperties() : renderMasterPageProperties();
        }
        if (selectedElements.length === 1) {
            return renderElementProperties(selectedElements[0]);
        }
        return renderMultiSelectProperties();
    };

  return (
    <div className="h-full overflow-y-auto bg-white">
        {renderContent()}
    </div>
  );
};

export default PropertiesPanel;
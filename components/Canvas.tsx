import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Page, WorkbookElement, PublishingPreset, MasterPage, Asset, TextStyle, Guide, DataVariable } from '../types';
import Ruler from './Ruler';
import { CheckIcon, LinkIcon, RotateCwIcon, PlusIcon, Link2Icon } from './icons';

interface CanvasProps {
  page?: Page; // The current page being viewed/edited
  masterPage?: MasterPage; // The current master page being edited
  allMasterPages: MasterPage[];
  publishingPreset: PublishingPreset;
  margins: { top: number; bottom: number; inside: number; outside: number; bleed: number };
  selectedElements: WorkbookElement[];
  onSetSelectedElementIds: (ids: string[]) => void;
  onUpdateElements: (updates: {id: string, updates: Partial<WorkbookElement>}[], isInteractive?: boolean) => void;
  onDropFromLibrary: (asset: Asset, x: number, y: number) => void;
  showSafetyLines: boolean;
  showRulers: boolean;
  editMode: 'pages' | 'masters';
  currentPageIndex: number;
  textStyles: TextStyle[];
  dataVariables: DataVariable[];
  // Guides
  onAddGuide: (guide: Omit<Guide, 'id'>) => void;
  onUpdateGuide: (id: string, updates: Partial<Guide>) => void;
  // Text Flow
  linkingState: { fromElementId: string } | null;
  onStartLinkFlow: (fromElementId: string) => void;
  onCompleteLinkFlow: (toElementId: string) => void;
  onCancelLinkFlow: () => void;
}

type InteractionState = 'idle' | 'dragging' | 'resizing' | 'rotating';
type ResizingHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

const RULER_SIZE = 30;

const substituteVariables = (text: string, variables: DataVariable[]): string => {
  if (!text.includes('{{')) return text;
  let substitutedText = text;
  variables.forEach(variable => {
    const regex = new RegExp(`{{${variable.name}}}`, 'g');
    substitutedText = substitutedText.replace(regex, variable.value);
  });
  return substitutedText;
};

// A hook to measure text overflow
const useTextOverflow = (element: WorkbookElement, textStyles: TextStyle[], dataVariables: DataVariable[]) => {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textMeasurementRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (element.type !== 'text' || !textMeasurementRef.current) return;

        const measureDiv = textMeasurementRef.current;
        const appliedTextStyle = textStyles.find(ts => ts.id === element.textStyleId);
        const finalStyle = { ...appliedTextStyle?.style, ...element.style };
        
        // Apply all relevant styles for accurate measurement
        measureDiv.style.width = `${element.width}px`;
        measureDiv.style.height = 'auto'; // Let it grow
        measureDiv.style.fontSize = `${finalStyle.fontSize}px`;
        measureDiv.style.fontFamily = finalStyle.fontFamily;
        measureDiv.style.lineHeight = `${finalStyle.lineHeight}`;
        measureDiv.style.letterSpacing = `${finalStyle.letterSpacing}px`;
        measureDiv.style.fontWeight = finalStyle.fontWeight || 'normal';
        measureDiv.style.fontStyle = finalStyle.fontStyle || 'normal';
        measureDiv.style.whiteSpace = 'pre-wrap';
        measureDiv.style.wordBreak = 'break-word';

        measureDiv.textContent = substituteVariables(element.content, dataVariables);

        setIsOverflowing(measureDiv.scrollHeight > element.height);

    }, [element.content, element.width, element.height, element.style, element.textStyleId, textStyles, dataVariables, element.type]);

    return { isOverflowing, textMeasurementRef };
};


const Canvas: React.FC<CanvasProps> = ({ 
  page, 
  masterPage,
  allMasterPages,
  publishingPreset, 
  margins,
  selectedElements, 
  onSetSelectedElementIds, 
  onUpdateElements,
  onDropFromLibrary,
  showSafetyLines,
  showRulers,
  editMode,
  currentPageIndex,
  textStyles,
  dataVariables,
  onAddGuide,
  onUpdateGuide,
  linkingState,
  onStartLinkFlow,
  onCompleteLinkFlow,
  onCancelLinkFlow,
 }) => {
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  const [interactionData, setInteractionData] = useState<any>({});
  
  const currentDisplay = editMode === 'pages' ? page : masterPage;

  const selectionBox = useMemo(() => {
    if (selectedElements.length === 0) return null;

    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedElements]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.id === 'canvas-area') {
      onSetSelectedElementIds([]);
    }
     if (linkingState) {
      onCancelLinkFlow();
    }
  };
  
  const handleElementMouseDown = (e: React.MouseEvent, element: WorkbookElement) => {
    e.stopPropagation();
    e.preventDefault();

    if (linkingState) {
        onCompleteLinkFlow(element.id);
        return;
    }

    if (element.locked) return;

    if (e.shiftKey) {
        const newSelection = selectedElements.some(el => el.id === element.id)
            ? selectedElements.map(el => el.id).filter(id => id !== element.id)
            : [...selectedElements.map(el => el.id), element.id];
        onSetSelectedElementIds(newSelection);
    } else {
         if (!selectedElements.some(el => el.id === element.id)) {
            onSetSelectedElementIds([element.id]);
        }
    }
    
    setInteractionState('dragging');
    setInteractionData({
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialElements: JSON.parse(JSON.stringify(currentDisplay?.elements.filter(el => 
            selectedElements.some(sel => sel.id === el.id) || (element.groupId && el.groupId === element.groupId)
        )))
    });
  };
  
  const calculateResizeUpdates = (handle: ResizingHandle, dx: number, dy: number, initialSelectionBox: any, initialElements: any[]) => {
      let newBoxWidth = initialSelectionBox.width;
      let newBoxHeight = initialSelectionBox.height;
      const minSize = 20;

      if (handle.includes('e')) newBoxWidth = Math.max(minSize, initialSelectionBox.width + dx);
      if (handle.includes('w')) newBoxWidth = Math.max(minSize, initialSelectionBox.width - dx);
      if (handle.includes('s')) newBoxHeight = Math.max(minSize, initialSelectionBox.height + dy);
      if (handle.includes('n')) newBoxHeight = Math.max(minSize, initialSelectionBox.height - dy);
      
      const scaleX = newBoxWidth / initialSelectionBox.width;
      const scaleY = newBoxHeight / initialSelectionBox.height;

      const newBoxX = handle.includes('w') ? initialSelectionBox.x + initialSelectionBox.width - newBoxWidth : initialSelectionBox.x;
      const newBoxY = handle.includes('n') ? initialSelectionBox.y + initialSelectionBox.height - newBoxHeight : initialSelectionBox.y;

      return initialElements.map((el: WorkbookElement) => {
          const relativeX = el.x - initialSelectionBox.x;
          const relativeY = el.y - initialSelectionBox.y;
          const newX = newBoxX + relativeX * scaleX;
          const newY = newBoxY + relativeY * scaleY;
          const newWidth = el.width * scaleX;
          const newHeight = el.height * scaleY;
          return { id: el.id, updates: { x: newX, y: newY, width: newWidth, height: newHeight } };
      });
  };
  
  const handleGlobalMouseUp = useCallback(() => {
    if (interactionState !== 'idle') {
        document.body.style.cursor = 'default';
        
        if(interactionData.finalUpdates) {
             onUpdateElements(interactionData.finalUpdates, false);
        }
        
        setInteractionState('idle');
        setInteractionData({});
    }
  }, [interactionState, interactionData, onUpdateElements]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (interactionState === 'idle') return;

    if (interactionState === 'dragging') {
        const dx = e.clientX - interactionData.initialMouseX;
        const dy = e.clientY - interactionData.initialMouseY;
        
        const updates = interactionData.initialElements.map((el: WorkbookElement) => ({
            id: el.id,
            updates: { x: el.x + dx, y: el.y + dy }
        }));
        
        onUpdateElements(updates, true); // Live update
        setInteractionData({...interactionData, finalUpdates: updates });

    } else if (interactionState === 'resizing') {
        const { handle, initialMouseX, initialMouseY, initialSelectionBox, initialElements } = interactionData;
        const dx = e.clientX - initialMouseX;
        const dy = e.clientY - initialMouseY;
        const updates = calculateResizeUpdates(handle, dx, dy, initialSelectionBox, initialElements);
        onUpdateElements(updates, true);
        setInteractionData({...interactionData, finalUpdates: updates });
    } else if (interactionState === 'rotating') {
        const { boxCenter, startAngle, initialElements, initialGroupRotation } = interactionData;
        const angle = Math.atan2(e.clientY - boxCenter.y, e.clientX - boxCenter.x) * 180 / Math.PI;
        const newGroupRotation = Math.round(angle - startAngle);

        if (initialElements.length === 1) {
            const updates = [{ id: initialElements[0].id, updates: { rotation: newGroupRotation } }];
            onUpdateElements(updates, true);
            setInteractionData({ ...interactionData, finalUpdates: updates });
            return;
        }

        const deltaAngleRad = (newGroupRotation - initialGroupRotation) * Math.PI / 180;
        
        const updates = initialElements.map((el: WorkbookElement) => {
            const elCenterX = el.x + el.width / 2;
            const elCenterY = el.y + el.height / 2;
            
            const vx = elCenterX - boxCenter.x;
            const vy = elCenterY - boxCenter.y;
            
            const cosDelta = Math.cos(deltaAngleRad);
            const sinDelta = Math.sin(deltaAngleRad);
            const newVx = vx * cosDelta - vy * sinDelta;
            const newVy = vx * sinDelta + vy * cosDelta;
            
            const newElCenterX = boxCenter.x + newVx;
            const newElCenterY = boxCenter.y + newVy;
            
            const newX = newElCenterX - el.width / 2;
            const newY = newElCenterY - el.height / 2;
            
            const newRotation = (el.rotation || 0) + (newGroupRotation - initialGroupRotation);
            
            return { id: el.id, updates: { x: newX, y: newY, rotation: newRotation } };
        });
        
        onUpdateElements(updates, true);
        setInteractionData({ ...interactionData, finalUpdates: updates });
    }
  }, [interactionState, interactionData, onUpdateElements, selectedElements]);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    try {
        const asset = JSON.parse(e.dataTransfer.getData('application/json')) as Asset;
        if (asset && asset.type === 'image' && asset.url) {
            const canvasRect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - canvasRect.left;
            let y = e.clientY - canvasRect.top;
            if(showRulers) {
                x -= RULER_SIZE;
                y -= RULER_SIZE;
            }
            onDropFromLibrary(asset, x, y);
        }
    } catch (error) {
        console.error("Failed to handle drop:", error);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);
  
  const getCursorForHandle = (handle: ResizingHandle): string => {
    switch (handle) {
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      default: return 'default';
    }
  };

  const renderElement = (element: WorkbookElement, isMasterElement: boolean = false) => {
    const isSelected = selectedElements.some(el => el.id === element.id);
    
    const currentElementState = currentDisplay?.elements.find(el => el.id === element.id) || element;
    
    let content = currentElementState.content;
    if (isMasterElement && element.type === 'text' && content.includes('{{pageNumber}}')) {
        content = content.replace(/{{pageNumber}}/g, (currentPageIndex + 1).toString());
    }
    if (element.type === 'text' || element.type === 'textarea') {
      content = substituteVariables(content, dataVariables);
    }
    const elementToRender = {...currentElementState, content};
    
    let renderedContent;
    switch (elementToRender.type) {
        case 'text':
            renderedContent = renderText(elementToRender, isMasterElement);
            break;
        case 'image':
            renderedContent = renderImage(elementToRender);
            break;
        case 'textarea':
            renderedContent = renderTextarea(elementToRender);
            break;
        case 'checkbox':
            renderedContent = renderCheckbox(elementToRender, isMasterElement);
            break;
        case 'shape':
            renderedContent = renderShape(elementToRender);
            break;
        case 'table':
            renderedContent = renderTable(elementToRender, isMasterElement);
            break;
        default:
            renderedContent = null;
    }

    const isLinkTarget = linkingState &&
                         element.type === 'text' &&
                         !element.previousElementId &&
                         element.id !== linkingState.fromElementId;
                         
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${elementToRender.x}px`,
      top: `${elementToRender.y}px`,
      width: `${elementToRender.width}px`,
      height: `${elementToRender.height}px`,
      boxSizing: 'border-box',
      transform: `rotate(${elementToRender.rotation || 0}deg)`,
      transformOrigin: 'center center',
      outline: isSelected && !isMasterElement ? '1px solid #6366f1' : 'none',
      outlineOffset: '1px',
      cursor: linkingState ? (isLinkTarget ? 'copy' : 'not-allowed') : (element.link ? 'pointer' : (isMasterElement || element.locked ? 'default' : 'grab')),
      pointerEvents: isMasterElement ? 'none' : 'auto',
      transition: 'box-shadow 0.2s',
      boxShadow: isLinkTarget ? '0 0 0 3px rgba(79, 70, 229, 0.5)' : 'none',
    };

    return (
      <div
        key={element.id}
        onMouseDown={(e) => !isMasterElement && handleElementMouseDown(e, element)}
        style={style}
      >
        {renderedContent}
        {element.link && !isMasterElement && (
            <div title={element.link} className="absolute top-0 right-0 -mt-2 -mr-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg pointer-events-none">
                <LinkIcon className="w-3 h-3" />
            </div>
        )}
      </div>
    );
  };
  
  const getHandlePosition = (handle: ResizingHandle): React.CSSProperties => {
    const positions = {
      n: { top: '0%', left: '50%' },
      s: { top: '100%', left: '50%' },
      e: { top: '50%', left: '100%' },
      w: { top: '50%', left: '0%' },
      nw: { top: '0%', left: '0%' },
      ne: { top: '0%', left: '100%' },
      sw: { top: '100%', left: '0%' },
      se: { top: '100%', left: '100%' },
    };
    return positions[handle];
  }

  const renderText = (element: WorkbookElement, isMasterElement: boolean) => {
    const { isOverflowing, textMeasurementRef } = useTextOverflow(element, textStyles, dataVariables);
    const appliedTextStyle = textStyles.find(ts => ts.id === element.textStyleId);
    const finalStyle = { ...appliedTextStyle?.style, ...element.style };
    
    const textDecorations = [];
    if (finalStyle.underline) textDecorations.push('underline');
    if (finalStyle.strikethrough) textDecorations.push('line-through');
    
    return (
      <div style={{width: '100%', height: '100%', position: 'relative'}}>
        <div ref={textMeasurementRef} style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} />
        <div
            style={{
            width: '100%',
            height: '100%',
            fontSize: finalStyle.fontSize,
            color: finalStyle.color,
            fontWeight: finalStyle.fontWeight,
            fontStyle: finalStyle.fontStyle,
            textAlign: finalStyle.textAlign,
            fontFamily: finalStyle.fontFamily,
            textDecoration: textDecorations.join(' '),
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            padding: '2px',
            lineHeight: finalStyle.lineHeight,
            letterSpacing: `${finalStyle.letterSpacing}px`,
            fontKerning: 'normal',
            }}
        >
            {element.content}
        </div>
        {!isMasterElement && !element.locked && element.type === 'text' && (
            <>
                {isOverflowing && !element.nextElementId && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center text-white pointer-events-none">
                        <PlusIcon className="w-3 h-3"/>
                    </div>
                )}
                <div 
                    onMouseDown={(e) => { e.stopPropagation(); onStartLinkFlow(element.id); }}
                    className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-slate-400 rounded-full cursor-copy flex items-center justify-center hover:bg-indigo-100"
                    title="Link text flow"
                >
                  <Link2Icon className="w-3 h-3 text-slate-600"/>
                </div>
            </>
        )}
      </div>
    );
  };

  const renderImage = (element: WorkbookElement) => (
    <img 
      src={element.content} 
      alt="workbook content" 
      className="w-full h-full object-cover" 
      onDragStart={(e) => e.preventDefault()}
    />
  );

  const renderTextarea = (element: WorkbookElement) => (
      <div
        className="w-full h-full bg-slate-50 border border-slate-300 rounded-md p-2 box-border"
        style={{
          fontSize: element.style.fontSize,
          color: element.style.color,
        }}
      >
        {element.content}
      </div>
  );

  const renderCheckbox = (element: WorkbookElement, isMasterElement: boolean) => (
    <div className="flex items-center w-full h-full gap-2">
        <div
            className={`w-5 h-5 border-2 rounded flex-shrink-0 flex items-center justify-center ${isMasterElement || element.locked ? '' : 'cursor-pointer'} ${element.checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-400'}`}
            onClick={(e) => {
                if (isMasterElement || element.locked) return;
                e.stopPropagation();
                onUpdateElements([{ id: element.id, updates: { checked: !element.checked } }], false);
            }}
            style={{ pointerEvents: 'auto' }}
        >
            {element.checked && <CheckIcon className="w-4 h-4 text-white" />}
        </div>
        <span
            className="truncate"
            style={{
                fontSize: element.style.fontSize,
                color: element.style.color,
                fontWeight: element.style.fontWeight,
                fontStyle: element.style.fontStyle,
            }}
        >
            {element.content}
        </span>
    </div>
  );
  
  const renderShape = (element: WorkbookElement) => {
    const { style, shapeType, width, height } = element;
    const strokeWidth = style.strokeWidth || 0;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {shapeType === 'rectangle' && (
          <rect
            x={strokeWidth / 2} y={strokeWidth / 2}
            width={Math.max(0, width - strokeWidth)} height={Math.max(0, height - strokeWidth)}
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={style.strokeDasharray === 'none' ? undefined : style.strokeDasharray}
            rx="2"
          />
        )}
        {shapeType === 'ellipse' && (
          <ellipse
            cx={width / 2} cy={height / 2}
            rx={Math.max(0, (width - strokeWidth) / 2)} ry={Math.max(0, (height - strokeWidth) / 2)}
            fill={style.fillColor}
            stroke={style.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={style.strokeDasharray === 'none' ? undefined : style.strokeDasharray}
          />
        )}
        {shapeType === 'line' && (
          <line
            x1={0} y1={0}
            x2={width} y2={height}
            stroke={style.strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={style.strokeDasharray === 'none' ? undefined : style.strokeDasharray}
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  };

  const renderTable = (element: WorkbookElement, isMasterElement: boolean) => {
    const { rows = 1, cols = 1, cellData = [], style } = element;

    const handleCellChange = (rowIndex: number, colIndex: number, newContent: string) => {
        if (!cellData || !cellData[rowIndex] || cellData[rowIndex][colIndex] === newContent) {
            return;
        }
        const newCellData = cellData.map((row, r) =>
            r === rowIndex ? row.map((cell, c) => (c === colIndex ? newContent : cell)) : row
        );
        onUpdateElements([{ id: element.id, updates: { cellData: newCellData } }]);
    };

    return (
        <div 
            className="w-full h-full grid"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                border: `${style.strokeWidth || 0}px solid ${style.strokeColor || 'transparent'}`,
                boxSizing: 'border-box'
            }}
        >
            {Array(rows).fill(0).map((_, r) =>
                Array(cols).fill(0).map((__, c) => (
                    <div
                        key={`${r}-${c}`}
                        contentEditable={!isMasterElement && !element.locked}
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellChange(r, c, e.currentTarget.innerText)}
                        style={{
                            borderRight: c < cols - 1 ? `${style.strokeWidth || 0}px solid ${style.strokeColor || 'transparent'}` : 'none',
                            borderBottom: r < rows - 1 ? `${style.strokeWidth || 0}px solid ${style.strokeColor || 'transparent'}` : 'none',
                            padding: '4px',
                            fontSize: `${style.fontSize}px`,
                            color: style.color,
                            overflow: 'hidden',
                            pointerEvents: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: (cellData[r] && cellData[r][c]) || '' }}
                    />
                ))
            )}
        </div>
    );
  };
  
  if (!currentDisplay) {
    return (
        <div className="flex-grow bg-slate-200 flex items-center justify-center">
            <p className="text-slate-500">No page selected.</p>
        </div>
    );
  }

  const appliedMaster = editMode === 'pages' && page?.masterPageId 
    ? allMasterPages.find(mp => mp.id === page.masterPageId) 
    : null;

  const isEvenPage = (currentPageIndex + 1) % 2 === 0;
  const leftMargin = isEvenPage ? margins.inside : margins.outside;
  const rightMargin = isEvenPage ? margins.outside : margins.inside;
  
  const visibleElements = currentDisplay.elements.filter(el => el.visible !== false);
  const visibleMasterElements = appliedMaster?.elements.filter(el => el.visible !== false) || [];

  return (
    <div className="flex-grow bg-slate-200 flex items-center justify-center p-8 overflow-auto">
      <div className="relative">
      {showRulers && (
        <>
            <Ruler orientation="horizontal" width={publishingPreset.width} height={RULER_SIZE} onAddGuide={(pos) => onAddGuide({ orientation: 'horizontal', position: pos })} />
            <Ruler orientation="vertical" width={RULER_SIZE} height={publishingPreset.height} onAddGuide={(pos) => onAddGuide({ orientation: 'vertical', position: pos })} />
            <div className="absolute top-0 left-0 w-8 h-8 bg-white border-r border-b border-slate-300" />
        </>
      )}
      <div
        className="bg-slate-400 shadow-lg"
        style={{
            padding: `${margins.bleed}px`,
            marginLeft: showRulers ? `${RULER_SIZE}px` : '0px',
            marginTop: showRulers ? `${RULER_SIZE}px` : '0px',
            cursor: linkingState ? 'copy' : 'default',
        }}
      >
        <div 
          id="canvas-area"
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="bg-white relative"
          style={{ 
            width: `${publishingPreset.width}px`, 
            height: `${publishingPreset.height}px`,
          }}
        >
          {visibleMasterElements.map(el => renderElement(el, true))}
          {visibleElements.map(el => renderElement(el))}
          
          {selectionBox && editMode !== 'masters' && (
            <div
                style={{
                    position: 'absolute',
                    left: `${selectionBox.x}px`,
                    top: `${selectionBox.y}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`,
                    outline: '2px solid #4f46e5',
                    outlineOffset: '2px',
                    pointerEvents: 'none',
                    transform: `rotate(${selectedElements.length === 1 ? selectedElements[0].rotation || 0 : 0}deg)`,
                }}
            >
                <div
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        document.body.style.cursor = 'grabbing';
                        const boxCenterX = selectionBox.x + selectionBox.width / 2;
                        const boxCenterY = selectionBox.y + selectionBox.height / 2;
                        const startAngle = Math.atan2(e.clientY - boxCenterY, e.clientX - boxCenterX) * 180 / Math.PI;
                        const initialGroupRotation = selectedElements.length === 1 ? selectedElements[0].rotation || 0 : 0;
                        
                        setInteractionState('rotating');
                        setInteractionData({
                            boxCenter: { x: boxCenterX, y: boxCenterY },
                            startAngle: startAngle - initialGroupRotation,
                            initialElements: JSON.parse(JSON.stringify(selectedElements)),
                            initialGroupRotation: initialGroupRotation,
                        });
                    }}
                    style={{
                        position: 'absolute',
                        top: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '18px',
                        height: '18px',
                        cursor: 'grabbing',
                        pointerEvents: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <RotateCwIcon className="w-4 h-4 text-indigo-600 bg-white rounded-full p-0.5" />
                </div>
                {(['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'] as ResizingHandle[]).map(handle => (
                    <div
                        key={handle}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            document.body.style.cursor = getCursorForHandle(handle);
                            setInteractionState('resizing');
                            setInteractionData({
                                handle,
                                initialMouseX: e.clientX,
                                initialMouseY: e.clientY,
                                initialSelectionBox: selectionBox,
                                initialElements: JSON.parse(JSON.stringify(selectedElements)),
                            });
                        }}
                        style={{
                        position: 'absolute',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#4f46e5',
                        border: '1px solid white',
                        borderRadius: '50%',
                        ...getHandlePosition(handle),
                        cursor: getCursorForHandle(handle),
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        }}
                    />
                ))}
            </div>
          )}
          
          {showSafetyLines && (
            <>
              {margins.bleed > 0 && 
                <div
                    className="absolute border-2 border-dashed border-red-500 pointer-events-none"
                    style={{
                        top: `-${margins.bleed}px`,
                        left: `-${margins.bleed}px`,
                        right: `-${margins.bleed}px`,
                        bottom: `-${margins.bleed}px`,
                    }}
                    aria-hidden="true"
                />
              }
              <div
                className="absolute border-2 border-dashed border-cyan-500 pointer-events-none"
                style={{
                  top: `${margins.top}px`,
                  left: `${leftMargin}px`,
                  right: `${rightMargin}px`,
                  bottom: `${margins.bottom}px`,
                }}
                aria-hidden="true"
              />
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Canvas;
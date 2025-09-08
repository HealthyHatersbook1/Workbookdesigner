import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import AssetLibraryPanel from './components/AssetLibraryPanel';
import StylesPanel from './components/StylesPanel';
import DataPanel from './components/DataPanel';
import LayersPanel from './components/LayersPanel';
import GlossaryModal from './components/GlossaryModal';
import GenerateIdeaModal from './components/GenerateIdeaModal';
import ImportTextModal from './components/ImportTextModal';
import AiFormatModal from './components/AiFormatModal';
import ExportingModal from './components/ExportingModal';
import ExportOptionsModal from './components/ExportOptionsModal';
import TemplateLibraryModal from './components/TemplateLibraryModal';
import AdaptLayoutModal from './components/AdaptLayoutModal';
import MarketingModal from './components/MarketingModal';
import FindAndReplaceModal from './components/FindAndReplaceModal';
import HelpModal from './components/HelpModal';
import Dashboard from './components/Dashboard';
import { exportToPdf, exportToImages } from './services/pdfService';
import { projectService } from './services/projectService';
import { DEFAULT_IMAGE_ELEMENT, DEFAULT_TEXT_ELEMENT, DEFAULT_TEXTAREA_ELEMENT, DEFAULT_CHECKBOX_ELEMENT, DEFAULT_RECTANGLE_ELEMENT, DEFAULT_ELLIPSE_ELEMENT, DEFAULT_LINE_ELEMENT, DEFAULT_TABLE_ELEMENT, DEFAULT_TEXT_STYLE, PUBLISHING_PRESETS, INITIAL_PAGE, INITIAL_MASTER_PAGE, INITIAL_COLOR_PALETTE, INITIAL_TEXT_STYLES } from './constants';
import type { Page, WorkbookElement, PublishingPreset, GlossaryTerm, Alignment, Template, MasterPage, Asset, BookType, ColorPaletteItem, TextStyle, WorkbookElementStyle, ExportOptions, ProjectFile, Guide, Project, PageViewMode, DataVariable } from './types';
import type { StyledWorksheet } from './services/geminiService';
import { SettingsIcon, LibraryIcon, PaletteIcon, DatabaseIcon, Layers3Icon } from './components/icons';

interface SearchResult {
    pageIndex: number;
    elementId: string;
    matchIndex: number; // The character index of the match within the element's content
    matchLength: number;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [selectedElementIds, _setSelectedElementIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState<'pages' | 'masters'>('pages');
  const [pageViewMode, setPageViewMode] = useState<PageViewMode>('list');
  const [showSafetyLines, setShowSafetyLines] = useState(true);
  const [showRulers, setShowRulers] = useState(true);

  // Modal states
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAIFormatterOpen, setIsAIFormatterOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [isFindAndReplaceOpen, setIsFindAndReplaceOpen] = useState(false);
  const [isExportOptionsOpen, setIsExportOptionsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [adaptLayoutConfirmation, setAdaptLayoutConfirmation] = useState<{ oldPreset: PublishingPreset; newPreset: PublishingPreset } | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'styles' | 'assets' | 'data' | 'layers'>('properties');
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  
  const [linkingState, setLinkingState] = useState<{ fromElementId: string } | null>(null);


  const projectImportInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setProjects(projectService.getProjects());
  }, []);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return null;
    return history[historyIndex];
  }, [activeProjectId, history, historyIndex]);

  // Auto-save the active project
  useEffect(() => {
    if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
    }
    if (activeProject) {
        autoSaveTimerRef.current = window.setTimeout(() => {
            projectService.saveProject(activeProject);
            setProjects(prevProjects => {
                const newProjects = [...prevProjects];
                const index = newProjects.findIndex(p => p.id === activeProject.id);
                if (index !== -1) {
                    newProjects[index] = activeProject;
                }
                return newProjects.sort((a,b) => b.lastModified - a.lastModified);
            });
        }, 500); // Debounce save
    }
    return () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
    };
  }, [activeProject]);

  const updateStateAndRecordHistory = useCallback((newStateFn: (prevState: Project) => Project) => {
    if (!activeProject) return;
    const resolvedState = newStateFn(activeProject);
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, resolvedState]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex, activeProject]);

  const updateStateLive = (newState: Project) => {
      const newHistory = [...history];
      newHistory[historyIndex] = newState;
      setHistory(newHistory);
  };
  
  // Derived state from the active project
  const {
      pages = [],
      masterPages = [],
      colorPalette = [],
      textStyles = [],
      glossary = [],
      assetLibrary = [],
      dataVariables = [],
      publishingPresetName = PUBLISHING_PRESETS[0].name,
      bookType = 'paperback',
      currentPageIndex = 0,
      currentMasterPageIndex = 0,
  } = activeProject || {};

  const publishingPreset = PUBLISHING_PRESETS.find(p => p.name === publishingPresetName) || PUBLISHING_PRESETS[0];
  
  const calculatedMargins = useMemo(() => {
    const preset = publishingPreset;
    const type = bookType;
    const pageCount = pages.length;

    const bookSettings = preset.bookTypes[type] || preset.bookTypes.paperback;
    const { margins } = bookSettings;

    const thresholdKeys = Object.keys(margins.inside).map(Number).sort((a, b) => b - a);
    let insideMargin = margins.inside[thresholdKeys[thresholdKeys.length -1]]; // Default to smallest
    for (const threshold of thresholdKeys) {
        if(pageCount >= threshold) {
            insideMargin = margins.inside[threshold];
            break;
        }
    }

    return {
      top: margins.top,
      bottom: margins.bottom,
      outside: margins.outside,
      inside: insideMargin,
      bleed: bookSettings.bleed,
    };

  }, [publishingPreset, bookType, pages.length]);
  
  const currentPage = pages[currentPageIndex];
  const currentMasterPage = masterPages[currentMasterPageIndex];
  const currentDisplay = editMode === 'pages' ? currentPage : currentMasterPage;
  const selectedElements = currentDisplay?.elements.filter(el => selectedElementIds.includes(el.id)) ?? [];
  
  const workbookTextContent = useMemo(() => {
    return pages
      .flatMap(page => page.elements)
      .filter(el => el.type === 'text' || el.type === 'textarea')
      .map(el => el.content)
      .join('\n\n');
  }, [pages]);

  const setSelectedElementIds = useCallback((ids: string[]) => {
    if (!currentDisplay) {
        _setSelectedElementIds([]);
        return;
    }
    if (ids.length === 1) {
        const element = currentDisplay.elements.find(el => el.id === ids[0]);
        if (element?.groupId) {
            const groupIds = currentDisplay.elements
                .filter(el => el.groupId === element.groupId)
                .map(el => el.id);
            _setSelectedElementIds(groupIds);
            return;
        }
    }
    _setSelectedElementIds(ids);
  }, [currentDisplay]);
  
  const updateProjectProperty = useCallback((key: keyof Project, value: any) => {
    updateStateAndRecordHistory(prev => ({...prev, [key]: value }));
  }, [updateStateAndRecordHistory]);


  const updatePage = useCallback((pageId: string, updates: Partial<Page>) => {
    updateStateAndRecordHistory(prevState => ({
        ...prevState,
        pages: prevState.pages.map(p => p.id === pageId ? { ...p, ...updates } : p)
    }));
  }, [updateStateAndRecordHistory]);

  const updateMasterPage = useCallback((masterPageId: string, updates: Partial<MasterPage>) => {
    updateStateAndRecordHistory(prevState => ({
        ...prevState,
        masterPages: prevState.masterPages.map(mp => mp.id === masterPageId ? { ...mp, ...updates } : mp)
    }));
  }, [updateStateAndRecordHistory]);

  const updateElements = useCallback((
    elementUpdates: { id: string; updates: Partial<WorkbookElement> }[],
    isInteractive: boolean = false
  ) => {
    if(!activeProject) return;

    const updateLogic = (projectState: Project): Project => {
      const newProjectState = JSON.parse(JSON.stringify(projectState));
      const collectionToUpdate = editMode === 'pages'
        ? newProjectState.pages[currentPageIndex].elements
        : newProjectState.masterPages[currentMasterPageIndex].elements;

      elementUpdates.forEach(({ id, updates }) => {
        const elementIndex = collectionToUpdate.findIndex((el: WorkbookElement) => el.id === id);
        if (elementIndex !== -1) {
          const element = collectionToUpdate[elementIndex];
          const finalUpdates = { ...updates };

          if (element.type === 'table' && (updates.rows !== undefined || updates.cols !== undefined)) {
            const oldRows = element.rows || 0;
            const oldCols = element.cols || 0;
            const newRows = updates.rows ?? oldRows;
            const newCols = updates.cols ?? oldCols;
            
            if (newRows !== oldRows || newCols !== oldCols) {
              const oldData = element.cellData || [];
              const newData = Array(newRows).fill(null).map((_, r) => 
                Array(newCols).fill(null).map((__, c) => 
                  (r < oldRows && c < oldCols) ? oldData[r][c] : ''
                )
              );
              finalUpdates.cellData = newData;
            }
          }
          collectionToUpdate[elementIndex] = { ...element, ...finalUpdates, style: { ...element.style, ...updates.style } };
        }
      });
      return newProjectState;
    };

    if (isInteractive) {
      updateStateLive(updateLogic(activeProject));
    } else {
      updateStateAndRecordHistory(updateLogic);
    }
  }, [editMode, currentPageIndex, currentMasterPageIndex, activeProject, updateStateAndRecordHistory, updateStateLive]);

  const updateElement = useCallback((elementId: string, updates: Partial<WorkbookElement>, isInteractive: boolean = false) => {
    updateElements([{ id: elementId, updates }], isInteractive);
  }, [updateElements]);
  
  const addElement = useCallback((elementData: Omit<WorkbookElement, 'id'>) => {
    const newElement: WorkbookElement = { id: crypto.randomUUID(), ...elementData };
    
    updateStateAndRecordHistory(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        if (editMode === 'pages') {
            newState.pages[currentPageIndex].elements.push(newElement);
        } else {
            newState.masterPages[currentMasterPageIndex].elements.push(newElement);
        }
        return newState;
    });

    setSelectedElementIds([newElement.id]);
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory, setSelectedElementIds]);
  
  const handleAddElement = useCallback((type: WorkbookElement['type'] | 'rectangle' | 'ellipse' | 'line') => {
    let elementDefaults;
    switch (type) {
        case 'text': elementDefaults = DEFAULT_TEXT_ELEMENT; break;
        case 'image': elementDefaults = DEFAULT_IMAGE_ELEMENT; break;
        case 'textarea': elementDefaults = DEFAULT_TEXTAREA_ELEMENT; break;
        case 'checkbox': elementDefaults = DEFAULT_CHECKBOX_ELEMENT; break;
        case 'rectangle': elementDefaults = DEFAULT_RECTANGLE_ELEMENT; break;
        case 'ellipse': elementDefaults = DEFAULT_ELLIPSE_ELEMENT; break;
        case 'line': elementDefaults = DEFAULT_LINE_ELEMENT; break;
        case 'table': elementDefaults = DEFAULT_TABLE_ELEMENT; break;
        default: return;
    }
    addElement(elementDefaults);
  }, [addElement]);


  const addElements = useCallback((elementsToAdd: Omit<WorkbookElement, 'id'>[]) => {
    const newElements = elementsToAdd.map(el => ({ ...el, id: crypto.randomUUID() }));
    updateStateAndRecordHistory(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        newState.pages[currentPageIndex].elements.push(...newElements);
        return newState;
    });
  }, [currentPageIndex, updateStateAndRecordHistory]);


  const deleteSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    updateStateAndRecordHistory(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        if (editMode === 'pages') {
            newState.pages[currentPageIndex].elements = newState.pages[currentPageIndex].elements.filter((el: WorkbookElement) => !selectedElementIds.includes(el.id));
        } else {
            newState.masterPages[currentMasterPageIndex].elements = newState.masterPages[currentMasterPageIndex].elements.filter((el: WorkbookElement) => !selectedElementIds.includes(el.id));
        }
        return newState;
    });
    setSelectedElementIds([]);
  }, [editMode, currentPageIndex, currentMasterPageIndex, selectedElementIds, updateStateAndRecordHistory, setSelectedElementIds]);

  const handleLayerAction = useCallback((elementId: string, action: 'front' | 'back' | 'forward' | 'backward') => {
    updateStateAndRecordHistory(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        const elements = editMode === 'pages' ? newState.pages[currentPageIndex].elements : newState.masterPages[currentMasterPageIndex].elements;
        const index = elements.findIndex((el: WorkbookElement) => el.id === elementId);
        if (index === -1) return prevState;

        switch(action) {
          case 'front': if (index < elements.length - 1) { const [el] = elements.splice(index, 1); elements.push(el); } break;
          case 'back': if (index > 0) { const [el] = elements.splice(index, 1); elements.unshift(el); } break;
          case 'forward': if (index < elements.length - 1) { [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]]; } break;
          case 'backward': if (index > 0) { [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]]; } break;
        }
        return newState;
    });
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);

  const handleReorderElementsByLayer = useCallback((fromVisualIndex: number, toVisualIndex: number) => {
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const elements = editMode === 'pages' 
            ? newState.pages[currentPageIndex].elements 
            : newState.masterPages[currentMasterPageIndex].elements;
        
        const len = elements.length;
        const fromActualIndex = len - 1 - fromVisualIndex;
        const toActualIndex = len - 1 - toVisualIndex;

        const [movedElement] = elements.splice(fromActualIndex, 1);
        elements.splice(toActualIndex, 0, movedElement);

        return newState;
    });
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);

  const handleToggleElementProperties = useCallback((ids: string[], updates: Partial<WorkbookElement>) => {
    const elementUpdates = ids.map(id => ({ id, updates }));
    updateElements(elementUpdates);
  }, [updateElements]);

  const handleAlignElements = useCallback((alignment: Alignment) => {
    if (selectedElements.length < 2) return;

    const minX = Math.min(...selectedElements.map(el => el.x));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
    const centerX = minX + (maxX - minX) / 2;
    const middleY = minY + (maxY - minY) / 2;

    const updates = selectedElements.map(el => {
        let newEl: Partial<WorkbookElement> = {};
        switch (alignment) {
            case 'left':   newEl.x = minX; break;
            case 'center': newEl.x = centerX - el.width / 2; break;
            case 'right':  newEl.x = maxX - el.width; break;
            case 'top':    newEl.y = minY; break;
            case 'middle': newEl.y = middleY - el.height / 2; break;
            case 'bottom': newEl.y = maxY - el.height; break;
        }
        return { id: el.id, updates: newEl };
    });
    
    updateElements(updates);
  }, [selectedElements, updateElements]);


  const addPage = () => {
    const newPage: Page = { id: crypto.randomUUID(), title: `Page ${pages.length + 1}`, elements: [], guides: [], masterPageId: null, isTocPage: false };
    updateProjectProperty('pages', [...pages, newPage]);
    updateProjectProperty('currentPageIndex', pages.length);
  };
  
  const addMasterPage = () => {
    const newMasterPage: MasterPage = { id: crypto.randomUUID(), title: `Master ${masterPages.length + 1}`, elements: [], guides: [] };
    updateProjectProperty('masterPages', [...masterPages, newMasterPage]);
    updateProjectProperty('currentMasterPageIndex', masterPages.length);
  };

  const handleReorderPages = useCallback((fromIndex: number, toIndex: number) => {
    updateStateAndRecordHistory(prev => {
        const newPages = [...prev.pages];
        const [movedPage] = newPages.splice(fromIndex, 1);
        newPages.splice(toIndex, 0, movedPage);
        
        let newCurrentPageIndex = prev.currentPageIndex;
        if (prev.currentPageIndex === fromIndex) {
            newCurrentPageIndex = toIndex;
        } else if (prev.currentPageIndex > fromIndex && prev.currentPageIndex <= toIndex) {
            newCurrentPageIndex--;
        } else if (prev.currentPageIndex < fromIndex && prev.currentPageIndex >= toIndex) {
            newCurrentPageIndex++;
        }

        return {...prev, pages: newPages, currentPageIndex: newCurrentPageIndex};
    });
  }, [updateStateAndRecordHistory]);
  
  const handleReorderMasterPages = useCallback((fromIndex: number, toIndex: number) => {
    updateStateAndRecordHistory(prev => {
        const newMasterPages = [...prev.masterPages];
        const [movedPage] = newMasterPages.splice(fromIndex, 1);
        newMasterPages.splice(toIndex, 0, movedPage);

        let newCurrentMasterPageIndex = prev.currentMasterPageIndex;
        if (prev.currentMasterPageIndex === fromIndex) {
            newCurrentMasterPageIndex = toIndex;
        } else if (prev.currentMasterPageIndex > fromIndex && prev.currentMasterPageIndex <= toIndex) {
            newCurrentMasterPageIndex--;
        } else if (prev.currentMasterPageIndex < fromIndex && prev.currentMasterPageIndex >= toIndex) {
            newCurrentMasterPageIndex++;
        }

        return {...prev, masterPages: newMasterPages, currentMasterPageIndex: newCurrentMasterPageIndex };
    });
  }, [updateStateAndRecordHistory]);

  const handleImportText = useCallback((text: string) => {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '');
    if (paragraphs.length === 0) return;
    
    const ELEMENT_WIDTH = publishingPreset.width - (calculatedMargins.inside + calculatedMargins.outside);
    const elementsToAdd: Omit<WorkbookElement, 'id'>[] = paragraphs.map(p => {
        const fontSize = DEFAULT_TEXT_STYLE.fontSize || 16;
        const lineHeight = fontSize * 1.5;
        const charsPerLine = Math.floor(ELEMENT_WIDTH / (fontSize * 0.6));
        const numLines = Math.max(1, Math.ceil(p.length / (charsPerLine > 0 ? charsPerLine : 1)));
        const elementHeight = (numLines * lineHeight) + 10;

        return { type: 'text', x: calculatedMargins.inside, y: 0, width: ELEMENT_WIDTH, height: elementHeight, content: p, style: {}, textStyleId: textStyles.find(ts => ts.name === 'Body Paragraph')?.id || null, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null };
    });
    
    addElements(elementsToAdd);

  }, [publishingPreset, calculatedMargins, addElements, textStyles]);

  const handleApplyAIDesignLayout = useCallback((designedContent: StyledWorksheet) => {
    const newElements: WorkbookElement[] = designedContent.items.map(item => ({ ...item, id: crypto.randomUUID(), rotation: 0, locked: false, visible: true, style: { ...DEFAULT_TEXT_STYLE, ...item.style } }));
    const newPage: Page = { id: crypto.randomUUID(), title: designedContent.title, elements: newElements, guides: [], masterPageId: null, isTocPage: false };
    updateStateAndRecordHistory(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    updateProjectProperty('currentPageIndex', pages.length);
  }, [pages.length, updateStateAndRecordHistory, updateProjectProperty]);

  const handleLoadTemplate = useCallback((template: Template) => {
      if (!window.confirm("Loading a template will replace your current project. Are you sure?")) return;
      
      const newPages: Page[] = template.pages.map(pageTemplate => ({ ...pageTemplate, id: crypto.randomUUID(), guides: [], masterPageId: null, isTocPage: false, elements: pageTemplate.elements.map(el => ({ ...el, id: crypto.randomUUID(), rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null })) }));
      
      updateStateAndRecordHistory(prev => ({
        ...prev,
        pages: newPages,
        masterPages: [INITIAL_MASTER_PAGE],
        currentPageIndex: 0,
        currentMasterPageIndex: 0,
      }));
      setSelectedElementIds([]);
      setEditMode('pages');
      setIsTemplateLibraryOpen(false);
  }, [updateStateAndRecordHistory, setSelectedElementIds]);
  
  const handleAddToAssetLibrary = useCallback((url: string) => {
    updateStateAndRecordHistory(prev => {
        if (prev.assetLibrary.some(asset => asset.url === url)) {
            return prev; // Avoid duplicates
        }
        const newAsset: Asset = { id: crypto.randomUUID(), type: 'image', url };
        return { ...prev, assetLibrary: [...prev.assetLibrary, newAsset] };
    });
  }, [updateStateAndRecordHistory]);
  
  const handleDropFromLibrary = useCallback((asset: Asset, x: number, y: number) => {
    const newElementData: Omit<WorkbookElement, 'id'> = {
      ...DEFAULT_IMAGE_ELEMENT,
      content: asset.url,
      x,
      y,
    };
    addElement(newElementData);
  }, [addElement]);
  
  const handleAssetLibraryClick = useCallback((asset: Asset) => {
    if (selectedElements.length === 1 && selectedElements[0].type === 'image') {
      updateElement(selectedElements[0].id, { content: asset.url });
    }
  }, [selectedElements, updateElement]);

  const handleGroupElements = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    const newGroupId = crypto.randomUUID();
    const updates = selectedElementIds.map(id => ({
        id,
        updates: { groupId: newGroupId }
    }));
    updateElements(updates);
  }, [selectedElementIds, updateElements]);

  const handleUngroupElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const updates = selectedElementIds.map(id => ({
        id,
        updates: { groupId: undefined }
    }));
    updateElements(updates);
  }, [selectedElementIds, updateElements]);

  const handleGenerateOrUpdateToc = useCallback(() => {
    updateStateAndRecordHistory(prevState => {
        const newState = JSON.parse(JSON.stringify(prevState));
        const tocPageIndex = newState.pages.findIndex((p: Page) => p.isTocPage);

        let existingTocPage = null;
        if (tocPageIndex > -1) {
            existingTocPage = newState.pages.splice(tocPageIndex, 1)[0];
        }
        
        const contentPages = newState.pages;
        const headings: { text: string; pageNumber: number }[] = [];
        contentPages.forEach((page: Page, index: number) => {
            const pageNumber = index + 2; // +1 for 1-based index, +1 for ToC page at start
            page.elements.forEach((el: WorkbookElement) => {
                if (el.isTocHeading) {
                    headings.push({ text: el.content, pageNumber });
                }
            });
        });

        const tocTitle: Omit<WorkbookElement, 'id'> = {
            ...DEFAULT_TEXT_ELEMENT,
            content: 'Table of Contents',
            x: calculatedMargins.inside,
            y: calculatedMargins.top + 20,
            width: publishingPreset.width - (calculatedMargins.inside + calculatedMargins.outside),
            height: 60,
            textStyleId: textStyles.find(ts => ts.name === 'Heading 1')?.id || null,
        };
        
        let currentY = calculatedMargins.top + 100;
        const tocLineHeight = 30;
        const tocElements: WorkbookElement[] = [
            {...tocTitle, id: crypto.randomUUID(), rotation: 0, isTocHeading: false, internalLinkPageNumber: undefined, locked: false, visible: true, nextElementId: null, previousElementId: null },
        ];
        
        headings.forEach(h => {
             const lineLength = 80; // Approximate chars on a line
             const textAndPage = `${h.text} ${h.pageNumber}`;
             const dots = '.'.repeat(Math.max(0, lineLength - textAndPage.length));
             const content = `${h.text} ${dots} ${h.pageNumber}`;
             
             const tocEntry: Omit<WorkbookElement, 'id'> = {
                ...DEFAULT_TEXT_ELEMENT,
                content,
                x: calculatedMargins.inside,
                y: currentY,
                width: publishingPreset.width - (calculatedMargins.inside + calculatedMargins.outside),
                height: tocLineHeight,
                textStyleId: null,
                style: { ...DEFAULT_TEXT_STYLE, fontSize: 16, fontFamily: "'Courier New', Courier, monospace" },
                internalLinkPageNumber: h.pageNumber,
             };
             tocElements.push({ ...tocEntry, id: crypto.randomUUID(), rotation: 0, isTocHeading: false, locked: false, visible: true, nextElementId: null, previousElementId: null });
             currentY += tocLineHeight;
        });


        if (existingTocPage) {
            existingTocPage.elements = tocElements;
            newState.pages.unshift(existingTocPage);
        } else {
            const newTocPage: Page = {
                id: crypto.randomUUID(),
                title: 'Table of Contents',
                elements: tocElements,
                guides: [],
                masterPageId: null,
                isTocPage: true,
            };
            newState.pages.unshift(newTocPage);
        }
        return newState;
    });
  }, [updateStateAndRecordHistory, calculatedMargins, publishingPreset, textStyles]);

  const handleRequestPresetChange = useCallback((newPreset: PublishingPreset) => {
    if (newPreset.name !== publishingPreset.name) {
      setAdaptLayoutConfirmation({ oldPreset: publishingPreset, newPreset });
    }
  }, [publishingPreset]);

  const handleConfirmAdaptLayout = useCallback(() => {
    if (!adaptLayoutConfirmation) return;
    const { oldPreset, newPreset } = adaptLayoutConfirmation;

    const scaleX = newPreset.width / oldPreset.width;
    const scaleY = newPreset.height / oldPreset.height;
    const avgScale = (scaleX + scaleY) / 2;

    const adaptElements = (elements: WorkbookElement[]) => {
        return elements.map(el => {
            const newElement: WorkbookElement = {
                ...el,
                x: el.x * scaleX,
                y: el.y * scaleY,
                width: el.width * scaleX,
                height: el.height * scaleY,
                style: {
                    ...el.style,
                    fontSize: Math.round((el.style.fontSize || 16) * avgScale)
                }
            };
            return newElement;
        });
    };
    
    updateStateAndRecordHistory(prevState => ({
      ...prevState,
      pages: prevState.pages.map(p => ({ ...p, elements: adaptElements(p.elements) })),
      masterPages: prevState.masterPages.map(mp => ({ ...mp, elements: adaptElements(mp.elements) })),
      publishingPresetName: newPreset.name,
      bookType: (bookType === 'hardcover' && !newPreset.bookTypes.hardcover) ? 'paperback' : bookType,
    }));

    setAdaptLayoutConfirmation(null);
  }, [adaptLayoutConfirmation, bookType, updateStateAndRecordHistory]);
  
  const handleConfirmChangeDimensionsOnly = useCallback(() => {
    if (!adaptLayoutConfirmation) return;
    const { newPreset } = adaptLayoutConfirmation;
    updateStateAndRecordHistory(prev => ({
        ...prev,
        publishingPresetName: newPreset.name,
        bookType: (bookType === 'hardcover' && !newPreset.bookTypes.hardcover) ? 'paperback' : bookType,
    }));
    setAdaptLayoutConfirmation(null);
  }, [adaptLayoutConfirmation, bookType, updateStateAndRecordHistory]);

  const handleUpdateColorPalette = useCallback((id: string, updates: Partial<ColorPaletteItem>) => {
    const oldColor = colorPalette.find(c => c.id === id)?.color;
    const newColor = updates.color;
    
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const newPalette = newState.colorPalette.map((item: ColorPaletteItem) => item.id === id ? { ...item, ...updates } : item);
        newState.colorPalette = newPalette;
        
        if (newColor && oldColor && oldColor !== newColor) {
            const allElements = [...newState.pages.flatMap((p:Page) => p.elements), ...newState.masterPages.flatMap((mp:MasterPage) => mp.elements)];
            allElements.forEach((el: WorkbookElement) => {
                if(el.style.color === oldColor) el.style.color = newColor;
                if(el.style.fillColor === oldColor) el.style.fillColor = newColor;
                if(el.style.strokeColor === oldColor) el.style.strokeColor = newColor;
            });
        }
        return newState;
    });
  }, [colorPalette, updateStateAndRecordHistory]);

  const handleAddColorToPalette = useCallback(() => {
    const newItem: ColorPaletteItem = { id: crypto.randomUUID(), name: 'New Color', color: '#dddddd' };
    updateStateAndRecordHistory(prev => ({ ...prev, colorPalette: [...prev.colorPalette, newItem] }));
  }, [updateStateAndRecordHistory]);

  const handleDeleteColorFromPalette = useCallback((id: string) => {
    updateStateAndRecordHistory(prev => ({ ...prev, colorPalette: prev.colorPalette.filter(c => c.id !== id) }));
  }, [updateStateAndRecordHistory]);
  
  const handleUpdateTextStyle = useCallback((id: string, updates: Partial<TextStyle>) => {
      updateStateAndRecordHistory(prev => ({ ...prev, textStyles: prev.textStyles.map(ts => ts.id === id ? {...ts, ...updates} : ts) }));
  }, [updateStateAndRecordHistory]);

  const handleAddTextStyle = useCallback(() => {
      let baseStyle: WorkbookElementStyle = DEFAULT_TEXT_STYLE;
      if(selectedElements.length === 1 && selectedElements[0].type === 'text') {
          const appliedTextStyle = textStyles.find(ts => ts.id === selectedElements[0].textStyleId);
          baseStyle = { ...appliedTextStyle?.style, ...selectedElements[0].style };
      }
      const newStyle: TextStyle = { id: crypto.randomUUID(), name: `New Style ${textStyles.length + 1}`, style: baseStyle };
      updateStateAndRecordHistory(prev => ({ ...prev, textStyles: [...prev.textStyles, newStyle] }));
  }, [updateStateAndRecordHistory, selectedElements, textStyles]);
  
  const handleDeleteTextStyle = useCallback((id: string) => {
    updateStateAndRecordHistory(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      newState.textStyles = newState.textStyles.filter((ts: TextStyle) => ts.id !== id);
      const allElements = [...newState.pages.flatMap((p:Page) => p.elements), ...newState.masterPages.flatMap((mp:MasterPage) => mp.elements)];
      allElements.forEach((el: WorkbookElement) => {
          if(el.textStyleId === id) {
              el.textStyleId = null; 
          }
      });
      return newState;
    });
  }, [updateStateAndRecordHistory]);
  
  const handleAddDataVariable = useCallback(() => {
    const newVar: DataVariable = { id: crypto.randomUUID(), name: `newVar${dataVariables.length + 1}`, value: '' };
    updateStateAndRecordHistory(prev => ({ ...prev, dataVariables: [...prev.dataVariables, newVar] }));
  }, [dataVariables.length, updateStateAndRecordHistory]);

  const handleUpdateDataVariable = useCallback((id: string, updates: Partial<DataVariable>) => {
    updateStateAndRecordHistory(prev => ({
      ...prev,
      dataVariables: prev.dataVariables.map(dv => dv.id === id ? { ...dv, ...updates } : dv),
    }));
  }, [updateStateAndRecordHistory]);

  const handleDeleteDataVariable = useCallback((id: string) => {
    updateStateAndRecordHistory(prev => ({
      ...prev,
      dataVariables: prev.dataVariables.filter(dv => dv.id !== id),
    }));
  }, [updateStateAndRecordHistory]);

  const handleFind = useCallback((query: string) => {
    if (!query) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const results: SearchResult[] = [];
    pages.forEach((page, pageIndex) => {
      page.elements.forEach(element => {
        if (element.type === 'text' || element.type === 'textarea') {
          let matchIndex = -1;
          const regex = new RegExp(query, 'gi');
          let match;
          while ((match = regex.exec(element.content)) !== null) {
            results.push({
              pageIndex,
              elementId: element.id,
              matchIndex: match.index,
              matchLength: match[0].length,
            });
          }
        }
      });
    });
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [pages]);

  const handleNavigateFindResults = useCallback((direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(prev => {
      const newIndex = direction === 'next' ? prev + 1 : prev - 1;
      return (newIndex + searchResults.length) % searchResults.length;
    });
  }, [searchResults.length]);

  const handleReplace = useCallback((replaceWith: string) => {
    if (searchResults.length === 0 || currentResultIndex === -1) return;
    
    const currentResult = searchResults[currentResultIndex];
    const { pageIndex, elementId, matchIndex, matchLength } = currentResult;
    
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const element = newState.pages[pageIndex].elements.find((el: WorkbookElement) => el.id === elementId);
        if(element) {
            const content = element.content;
            element.content = content.substring(0, matchIndex) + replaceWith + content.substring(matchIndex + matchLength);
        }
        return newState;
    });
    
    setSearchResults([]);
    setCurrentResultIndex(-1);

  }, [searchResults, currentResultIndex, updateStateAndRecordHistory]);
  
  const handleReplaceAll = useCallback((findQuery: string, replaceWith: string) => {
    if(!findQuery) return;
    
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const regex = new RegExp(findQuery, 'gi');
        newState.pages.forEach((page: Page) => {
            page.elements.forEach((el: WorkbookElement) => {
                if((el.type === 'text' || el.type === 'textarea') && el.content.match(regex)) {
                    el.content = el.content.replace(regex, replaceWith);
                }
            })
        });
        return newState;
    });

    setSearchResults([]);
    setCurrentResultIndex(-1);
    setIsFindAndReplaceOpen(false);
  }, [updateStateAndRecordHistory]);

  const handleExportProject = useCallback(() => {
    if (!activeProject) return;
    const { id, name, lastModified, currentPageIndex, currentMasterPageIndex, ...projectData } = activeProject;
    const fileData: ProjectFile = { version: '1.0', ...projectData };
    const dataStr = JSON.stringify(fileData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${name}.workbook`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeProject]);

  const handleImportProject = useCallback(() => {
      projectImportInputRef.current?.click();
  }, []);

  const handleFileSelectedForImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error("Could not read file.");
        
        const projectData: ProjectFile = JSON.parse(result);

        if (!projectData.version || !Array.isArray(projectData.pages)) {
          throw new Error("Invalid project file format.");
        }
        
        const newProject = projectService.createProject(file.name.replace('.workbook', ''));
        const updatedProject: Project = {
            ...newProject,
            ...projectData,
            publishingPresetName: projectData.publishingPresetName || PUBLISHING_PRESETS[0].name,
            bookType: projectData.bookType || 'paperback',
            dataVariables: projectData.dataVariables || [],
        };
        projectService.saveProject(updatedProject);
        setProjects(projectService.getProjects());
        setActiveProjectId(updatedProject.id); // Open the newly imported project
        alert("Project imported successfully!");

      } catch (err) {
        console.error("Failed to import project:", err);
        alert(`Error importing project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        if (projectImportInputRef.current) {
            projectImportInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  }, []);

  const handleAddGuide = useCallback((guide: Omit<Guide, 'id'>) => {
    const newGuide = { ...guide, id: crypto.randomUUID() };
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        if (editMode === 'pages') {
            newState.pages[currentPageIndex].guides.push(newGuide);
        } else {
            newState.masterPages[currentMasterPageIndex].guides.push(newGuide);
        }
        return newState;
    });
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);
  
  const handleUpdateGuide = useCallback((id: string, updates: Partial<Guide>) => {
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const guides = editMode === 'pages' ? newState.pages[currentPageIndex].guides : newState.masterPages[currentMasterPageIndex].guides;
        const guideIndex = guides.findIndex((g: Guide) => g.id === id);
        if (guideIndex > -1) {
            guides[guideIndex] = { ...guides[guideIndex], ...updates };
        }
        return newState;
    });
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);
  
  const handleStartLinkFlow = useCallback((fromElementId: string) => {
    setLinkingState({ fromElementId });
  }, []);

  const handleCompleteLinkFlow = useCallback((toElementId: string) => {
    if (!linkingState) return;
    const { fromElementId } = linkingState;
    
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const elements = editMode === 'pages' ? newState.pages[currentPageIndex].elements : newState.masterPages[currentMasterPageIndex].elements;
        const fromEl = elements.find((el: WorkbookElement) => el.id === fromElementId);
        const toEl = elements.find((el: WorkbookElement) => el.id === toElementId);

        if (fromEl && toEl && fromEl.id !== toEl.id) {
            fromEl.nextElementId = toEl.id;
            toEl.previousElementId = fromEl.id;
        }
        return newState;
    });

    setLinkingState(null);
  }, [linkingState, editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);
  
  const handleBreakLinkFlow = useCallback((elementId: string) => {
    updateStateAndRecordHistory(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const elements = editMode === 'pages' ? newState.pages[currentPageIndex].elements : newState.masterPages[currentMasterPageIndex].elements;
        const el = elements.find((e: WorkbookElement) => e.id === elementId);

        if (el) {
            const prevEl = elements.find((e: WorkbookElement) => e.id === el.previousElementId);
            const nextEl = elements.find((e: WorkbookElement) => e.id === el.nextElementId);
            if (prevEl) prevEl.nextElementId = null;
            if (nextEl) nextEl.previousElementId = null;
            el.nextElementId = null;
            el.previousElementId = null;
        }
        return newState;
    });
  }, [editMode, currentPageIndex, currentMasterPageIndex, updateStateAndRecordHistory]);

  // FIX: Defined handleCancelLinkFlow to fix undefined function errors.
  const handleCancelLinkFlow = useCallback(() => {
    setLinkingState(null);
  }, []);

  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults[currentResultIndex]) {
        const { pageIndex, elementId } = searchResults[currentResultIndex];
        if (currentPageIndex !== pageIndex) {
            updateProjectProperty('currentPageIndex', pageIndex);
        }
        setSelectedElementIds([elementId]);
    }
  }, [currentResultIndex, searchResults, currentPageIndex, setSelectedElementIds, updateProjectProperty]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasTocPage = useMemo(() => pages.some(p => p.isTocPage), [pages]);

  const handleUndo = useCallback(() => { if (canUndo) setHistoryIndex(historyIndex - 1); }, [canUndo, historyIndex]);
  const handleRedo = useCallback(() => { if (canRedo) setHistoryIndex(historyIndex + 1); }, [canRedo, historyIndex]);
  
  const handleStartExport = async (options: ExportOptions) => {
      setIsExportOptionsOpen(false);
      setIsExporting(true);
      setExportProgress({ current: 0, total: pages.length });
      
      try {
        if (options.format === 'pdf') {
            await exportToPdf(pages, masterPages, textStyles, dataVariables, publishingPreset, bookType, options, setExportProgress);
        } else {
            await exportToImages(pages, masterPages, textStyles, dataVariables, publishingPreset, bookType, options, setExportProgress);
        }
      } catch (error) { 
          console.error(`Failed to export to ${options.format}:`, error); 
          alert(`An error occurred while exporting to ${options.format.toUpperCase()}.`); 
      } finally { 
          setIsExporting(false); 
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;
      if (e.key === 'Escape') {
          // FIX: Called handleCancelLinkFlow when Escape key is pressed during linking.
          if(linkingState) handleCancelLinkFlow();
      }
      if (isModifier && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) { handleRedo(); } else { handleUndo(); } }
      if (isModifier && e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // FIX: Added handleCancelLinkFlow to the dependency array.
  }, [handleUndo, handleRedo, linkingState, handleCancelLinkFlow]);
  
  const handleCreateProject = (name: string) => {
    const newProject = projectService.createProject(name);
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
  };
  
  const handleOpenProject = (projectId: string) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if(projectToLoad) {
      setHistory([projectToLoad]);
      setHistoryIndex(0);
      setActiveProjectId(projectId);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    projectService.deleteProject(projectId);
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    projectService.renameProject(projectId, newName);
    setProjects(projectService.getProjects());
    if (activeProjectId === projectId) {
        updateProjectProperty('name', newName);
    }
  };
  
  useEffect(() => {
    if (activeProject && currentPageIndex >= pages.length) updateProjectProperty('currentPageIndex', Math.max(0, pages.length - 1));
  }, [pages, currentPageIndex, activeProject, updateProjectProperty]);
  
  useEffect(() => {
    if (activeProject && currentMasterPageIndex >= masterPages.length) updateProjectProperty('currentMasterPageIndex', Math.max(0, masterPages.length - 1));
  }, [masterPages, currentMasterPageIndex, activeProject, updateProjectProperty]);

  useEffect(() => { setSelectedElementIds([]); }, [editMode, currentPageIndex, currentMasterPageIndex, setSelectedElementIds]);
  
  useEffect(() => {
    if (!currentDisplay) return;
    const currentElementIds = new Set(currentDisplay.elements.map(el => el.id));
    const newSelectedIds = selectedElementIds.filter(id => currentElementIds.has(id));
    if(newSelectedIds.length !== selectedElementIds.length) setSelectedElementIds(newSelectedIds);
  }, [currentDisplay, selectedElementIds, setSelectedElementIds]);

  if (!activeProject) {
    return (
      <Dashboard
        projects={projects}
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />
    );
  }

  return (
    <div className="flex h-screen font-sans">
      <input type="file" ref={projectImportInputRef} onChange={handleFileSelectedForImport} accept=".workbook,application/json" style={{ display: 'none' }} />
      <Toolbar
        projectName={activeProject.name}
        onRenameProject={(name) => updateProjectProperty('name', name)}
        onNavigateHome={() => setActiveProjectId(null)}
        pages={pages}
        currentPageIndex={currentPageIndex}
        setCurrentPageIndex={(i) => updateProjectProperty('currentPageIndex', i)}
        onAddPage={addPage}
        onReorderPages={handleReorderPages}
        masterPages={masterPages}
        currentMasterPageIndex={currentMasterPageIndex}
        setCurrentMasterPageIndex={(i) => updateProjectProperty('currentMasterPageIndex', i)}
        onAddMasterPage={addMasterPage}
        onReorderMasterPages={handleReorderMasterPages}
        editMode={editMode}
        setEditMode={setEditMode}
        pageViewMode={pageViewMode}
        setPageViewMode={setPageViewMode}
        onAddElement={handleAddElement}
        publishingPreset={publishingPreset}
        onRequestPresetChange={handleRequestPresetChange}
        bookType={bookType}
        setBookType={(bt) => updateProjectProperty('bookType', bt)}
        calculatedMargins={calculatedMargins}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
        onOpenAIFormatter={() => setIsAIFormatterOpen(true)}
        onOpenTextImporter={() => setIsImportModalOpen(true)}
        onOpenTemplateLibrary={() => setIsTemplateLibraryOpen(true)}
        onOpenMarketingModal={() => setIsMarketingModalOpen(true)}
        onOpenFindAndReplace={() => setIsFindAndReplaceOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        showSafetyLines={showSafetyLines}
        setShowSafetyLines={setShowSafetyLines}
        showRulers={showRulers}
        setShowRulers={setShowRulers}
        onOpenExportOptions={() => setIsExportOptionsOpen(true)}
        onGenerateOrUpdateToc={handleGenerateOrUpdateToc}
        hasTocPage={hasTocPage}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
      />
      <Canvas
        page={currentPage}
        masterPage={currentMasterPage}
        allMasterPages={masterPages}
        editMode={editMode}
        publishingPreset={publishingPreset}
        margins={calculatedMargins}
        selectedElements={selectedElements}
        onSetSelectedElementIds={setSelectedElementIds}
        onUpdateElements={updateElements}
        onDropFromLibrary={handleDropFromLibrary}
        showSafetyLines={showSafetyLines}
        showRulers={showRulers}
        currentPageIndex={currentPageIndex}
        textStyles={textStyles}
        dataVariables={dataVariables}
        onAddGuide={handleAddGuide}
        onUpdateGuide={handleUpdateGuide}
        linkingState={linkingState}
        onStartLinkFlow={handleStartLinkFlow}
        onCompleteLinkFlow={handleCompleteLinkFlow}
        onCancelLinkFlow={handleCancelLinkFlow}
      />
      <div className="w-96 bg-white h-full shadow-md flex flex-col">
        <div className="flex border-b">
          <button onClick={() => setRightPanelTab('properties')} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold ${rightPanelTab === 'properties' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <SettingsIcon className="w-5 h-5" /> Properties
          </button>
           <button onClick={() => setRightPanelTab('layers')} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold ${rightPanelTab === 'layers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Layers3Icon className="w-5 h-5" /> Layers
          </button>
          <button onClick={() => setRightPanelTab('styles')} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold ${rightPanelTab === 'styles' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <PaletteIcon className="w-5 h-5" /> Styles
          </button>
          <button onClick={() => setRightPanelTab('assets')} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold ${rightPanelTab === 'assets' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LibraryIcon className="w-5 h-5" /> Assets
          </button>
           <button onClick={() => setRightPanelTab('data')} className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-semibold ${rightPanelTab === 'data' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <DatabaseIcon className="w-5 h-5" /> Data
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {rightPanelTab === 'properties' && (
            <PropertiesPanel
              selectedElements={selectedElements}
              currentPage={currentPage}
              onUpdatePage={updatePage}
              currentMasterPage={currentMasterPage}
              onUpdateMasterPage={updateMasterPage}
              masterPages={masterPages}
              editMode={editMode}
              onUpdateElement={updateElement}
              onUpdateElements={updateElements}
              onDeleteElements={deleteSelectedElements}
              onLayerAction={handleLayerAction}
              onToggleLock={(ids, locked) => handleToggleElementProperties(ids, { locked })}
              onAlignElements={handleAlignElements}
              onGroupElements={handleGroupElements}
              onUngroupElements={handleUngroupElements}
              onAddAsset={handleAddToAssetLibrary}
              colorPalette={colorPalette}
              textStyles={textStyles}
              onStartLinkFlow={handleStartLinkFlow}
              onBreakLinkFlow={handleBreakLinkFlow}
            />
          )}
          {rightPanelTab === 'layers' && currentDisplay && (
            <LayersPanel
                elements={currentDisplay.elements}
                selectedElementIds={selectedElementIds}
                onSelectElementIds={setSelectedElementIds}
                onReorder={handleReorderElementsByLayer}
                onToggleVisibility={(ids, visible) => handleToggleElementProperties(ids, { visible })}
                onToggleLock={(ids, locked) => handleToggleElementProperties(ids, { locked })}
            />
          )}
          {rightPanelTab === 'styles' && (
             <StylesPanel
                colorPalette={colorPalette}
                textStyles={textStyles}
                onUpdateColorPalette={handleUpdateColorPalette}
                onAddColorToPalette={handleAddColorToPalette}
                onDeleteColorFromPalette={handleDeleteColorFromPalette}
                onUpdateTextStyle={handleUpdateTextStyle}
                onAddTextStyle={handleAddTextStyle}
                onDeleteTextStyle={handleDeleteTextStyle}
            />
          )}
          {rightPanelTab === 'assets' && (
            <AssetLibraryPanel
              assets={assetLibrary}
              onAssetClick={handleAssetLibraryClick}
              selectedElement={selectedElements.length === 1 ? selectedElements[0] : null}
            />
          )}
          {rightPanelTab === 'data' && (
            <DataPanel
              dataVariables={dataVariables}
              onAddDataVariable={handleAddDataVariable}
              onUpdateDataVariable={handleUpdateDataVariable}
              onDeleteDataVariable={handleDeleteDataVariable}
            />
          )}
        </div>
      </div>
      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        glossary={glossary}
        setGlossary={(g) => updateProjectProperty('glossary', g)}
      />
      <GenerateIdeaModal 
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        addElementsToPage={addElements}
      />
      <ImportTextModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportText}
      />
       <AiFormatModal
        isOpen={isAIFormatterOpen}
        onClose={() => setIsAIFormatterOpen(false)}
        onApplyLayout={handleApplyAIDesignLayout}
        publishingPreset={publishingPreset}
        calculatedMargins={calculatedMargins}
      />
      <TemplateLibraryModal
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onSelectTemplate={handleLoadTemplate}
      />
      {adaptLayoutConfirmation && (
        <AdaptLayoutModal
          isOpen={true}
          onClose={() => setAdaptLayoutConfirmation(null)}
          onConfirmAdapt={handleConfirmAdaptLayout}
          onConfirmChangeDimensionsOnly={handleConfirmChangeDimensionsOnly}
          fromPreset={adaptLayoutConfirmation.oldPreset}
          toPreset={adaptLayoutConfirmation.newPreset}
        />
      )}
      <MarketingModal
        isOpen={isMarketingModalOpen}
        onClose={() => setIsMarketingModalOpen(false)}
        workbookContent={workbookTextContent}
      />
      <FindAndReplaceModal
        isOpen={isFindAndReplaceOpen}
        onClose={() => setIsFindAndReplaceOpen(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        onNavigate={handleNavigateFindResults}
        searchResultsCount={searchResults.length}
        currentResultIndex={currentResultIndex}
      />
      <ExportOptionsModal
        isOpen={isExportOptionsOpen}
        onClose={() => setIsExportOptionsOpen(false)}
        onExport={handleStartExport}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
      />
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      {isExporting && <ExportingModal progress={exportProgress} />}
    </div>
  );
}

export default App;
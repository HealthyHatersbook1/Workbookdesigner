export interface WorkbookElementStyle {
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;
  lineHeight?: number; // e.g., 1.5 for 150%
  letterSpacing?: number; // in pixels
  // For shapes and tables
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string; // e.g., '5, 5' for dashed
}

export interface WorkbookElement {
  id: string;
  type: 'text' | 'image' | 'textarea' | 'checkbox' | 'shape' | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  content: string; // text content, image URL, placeholder, or label
  style: WorkbookElementStyle;
  textStyleId?: string | null; // For reusable text styles
  checked?: boolean; // For checkbox type
  groupId?: string; // For grouping elements
  isTocHeading?: boolean; // For text elements to be included in ToC
  link?: string; // For hyperlinks on text and image elements
  internalLinkPageNumber?: number; // For ToC entries to link to a page
  locked?: boolean;
  visible?: boolean;

  // For shape type
  shapeType?: 'rectangle' | 'ellipse' | 'line';

  // For table type
  rows?: number;
  cols?: number;
  cellData?: string[][];
  
  // For text flow
  nextElementId?: string | null;
  previousElementId?: string | null;
}

export interface Guide {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number;
}

export interface Page {
  id:string;
  title: string;
  elements: WorkbookElement[];
  guides: Guide[];
  masterPageId: string | null;
  isTocPage?: boolean; // To identify the ToC page
}

export interface MasterPage {
  id: string;
  title: string;
  elements: WorkbookElement[];
  guides: Guide[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface MarginSettings {
  top: number;
  bottom: number;
  outside: number;
  inside: { // Gutter margin based on page count
    [pageCountThreshold: number]: number;
  };
}

export interface BookTypeSettings {
  bleed: number;
  margins: MarginSettings;
}

export interface PublishingPreset {
  name: string;
  width: number; // in pixels for canvas representation (trim box)
  height: number;
  bookTypes: {
    paperback: BookTypeSettings;
    hardcover?: BookTypeSettings; // Optional if not supported for a size
  };
}

export type BookType = 'paperback' | 'hardcover';


export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

// A template is a pre-designed set of pages
export interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  // Pages and elements are defined without IDs, they will be generated on load
  // FIX: Wrapped the page template type in parentheses to correctly define an array of page objects.
  pages: (Omit<Page, 'id' | 'elements' | 'masterPageId' | 'guides'> & { elements: Omit<WorkbookElement, 'id'>[] })[];
}

export interface Asset {
  id: string;
  type: 'image';
  url: string;
}

export interface ColorPaletteItem {
  id: string;
  name: string;
  color: string;
}

export interface TextStyle {
  id: string;
  name: string;
  style: WorkbookElementStyle;
}

export interface ExportOptions {
  format: 'pdf' | 'jpeg' | 'png';
  pageRange: string; // e.g., 'all', 'current', '1-5, 8'
  quality: 'low' | 'medium' | 'high';
}

export interface DataVariable {
  id: string;
  name: string;
  value: string;
}

export interface ProjectFile {
  version: string;
  pages: Page[];
  masterPages: MasterPage[];
  colorPalette: ColorPaletteItem[];
  textStyles: TextStyle[];
  glossary: GlossaryTerm[];
  assetLibrary: Asset[];
  publishingPresetName: string;
  bookType: BookType;
  dataVariables: DataVariable[];
}

export interface Project {
  id: string;
  name: string;
  lastModified: number; // timestamp
  // The core data of the workbook
  pages: Page[];
  masterPages: MasterPage[];
  colorPalette: ColorPaletteItem[];
  textStyles: TextStyle[];
  glossary: GlossaryTerm[];
  assetLibrary: Asset[];
  dataVariables: DataVariable[];
  publishingPresetName: string;
  bookType: BookType;
  // Editor-specific state
  currentPageIndex: number;
  currentMasterPageIndex: number;
}

export type PageViewMode = 'list' | 'grid';
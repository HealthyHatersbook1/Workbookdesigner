import type { PublishingPreset, Page, WorkbookElement, WorkbookElementStyle, MasterPage, ColorPaletteItem, TextStyle } from './types';

// Based on Amazon KDP specs for 6x9 inch book (576x864 px @ 96DPI)
const KDP_6x9_PAPERBACK: PublishingPreset['bookTypes']['paperback'] = {
  bleed: 12, // 0.125"
  margins: {
    top: 36,     // 0.375"
    bottom: 36,  // 0.375"
    outside: 24, // 0.25"
    inside: {
      24: 36,   // 0.375" for 24-150 pages
      151: 48,  // 0.5" for 151-300 pages
      301: 60,  // 0.625" for 301-500 pages
      501: 72,  // 0.75" for 501-700 pages
      701: 84,  // 0.875" for 701-828 pages
    }
  }
};

const KDP_6x9_HARDCOVER: PublishingPreset['bookTypes']['hardcover'] = {
  bleed: 12, // 0.125"
  margins: {
    top: 48,     // 0.5"
    bottom: 48,  // 0.5"
    outside: 48, // 0.5"
    inside: {
      55: 48,   // 0.5" for 55-150 pages
      151: 72,  // 0.75" for 151-550 pages
      551: 96,  // 1.0" for 551-828 pages
    }
  }
};


export const PUBLISHING_PRESETS: PublishingPreset[] = [
  { 
    name: 'Amazon KDP (6 x 9 in)', 
    width: 576, 
    height: 864,
    bookTypes: {
      paperback: KDP_6x9_PAPERBACK,
      hardcover: KDP_6x9_HARDCOVER,
    }
  },
  { 
    name: 'US Letter (8.5 x 11 in)', 
    width: 816, 
    height: 1056,
    bookTypes: {
      paperback: { // Using KDP specs for larger trim sizes as a base
        bleed: 12,
        margins: {
          top: 48,
          bottom: 48,
          outside: 36,
          inside: {
            24: 36,
            151: 48,
            301: 60,
            501: 72,
            701: 84
          }
        }
      }
    }
  },
  { 
    name: 'Ebook (1600 x 2560 px)', 
    width: 800, 
    height: 1280,
    bookTypes: {
      paperback: {
        bleed: 0,
        margins: { top: 40, bottom: 40, outside: 40, inside: { 1: 40 } }
      }
    }
  },
];

export const FONT_FACES = [
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Lora', value: "'Lora', serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
];

export const DEFAULT_TEXT_STYLE: WorkbookElementStyle = {
  fontSize: 16,
  color: '#0f172a', // slate-900
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  underline: false,
  strikethrough: false,
  fontFamily: FONT_FACES[0].value,
  lineHeight: 1.5,
  letterSpacing: 0,
};

export const INITIAL_COLOR_PALETTE: ColorPaletteItem[] = [
    { id: crypto.randomUUID(), name: 'Text-Dark', color: '#0f172a' },
    { id: crypto.randomUUID(), name: 'Text-Light', color: '#64748b' },
    { id: crypto.randomUUID(), name: 'Accent-Blue', color: '#4f46e5' },
    { id: crypto.randomUUID(), name: 'Accent-Red', color: '#dc2626' },
    { id: crypto.randomUUID(), name: 'Background', color: '#f1f5f9' },
];

export const INITIAL_TEXT_STYLES: TextStyle[] = [
    { 
        id: crypto.randomUUID(), 
        name: 'Heading 1', 
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 36, fontWeight: 'bold', fontFamily: FONT_FACES[4].value, lineHeight: 1.2, letterSpacing: -1 }
    },
    { 
        id: crypto.randomUUID(), 
        name: 'Heading 2', 
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 24, fontWeight: 'bold', lineHeight: 1.3 }
    },
    { 
        id: crypto.randomUUID(), 
        name: 'Body Paragraph', 
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 16, lineHeight: 1.6 }
    },
];


export const DEFAULT_TEXT_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'text',
  x: 20,
  y: 20,
  width: 200,
  height: 50,
  rotation: 0,
  content: 'New Text Box',
  style: {},
  textStyleId: INITIAL_TEXT_STYLES[2].id, // Default to Body Paragraph
  isTocHeading: false,
  internalLinkPageNumber: undefined,
  locked: false,
  visible: true,
  nextElementId: null,
  previousElementId: null,
};

export const DEFAULT_IMAGE_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'image',
  x: 20,
  y: 100,
  width: 300,
  height: 200,
  rotation: 0,
  content: 'https://images.pexels.com/photos/2078475/pexels-photo-2078475.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  style: {},
  locked: false,
  visible: true,
};

export const DEFAULT_TEXTAREA_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'textarea',
  x: 20,
  y: 200,
  width: 300,
  height: 100,
  rotation: 0,
  content: 'Your response here...',
  style: { ...DEFAULT_TEXT_STYLE, color: '#6b7280' },
  locked: false,
  visible: true,
};

export const DEFAULT_CHECKBOX_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'checkbox',
  x: 20,
  y: 320,
  width: 150,
  height: 25,
  rotation: 0,
  content: 'An option',
  style: { ...DEFAULT_TEXT_STYLE },
  checked: false,
  locked: false,
  visible: true,
};

export const DEFAULT_SHAPE_STYLE: WorkbookElementStyle = {
  fillColor: '#cbd5e1', // slate-300
  strokeColor: '#475569', // slate-600
  strokeWidth: 2,
  strokeDasharray: 'none',
};

export const DEFAULT_RECTANGLE_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'shape',
  shapeType: 'rectangle',
  x: 50, y: 50, width: 200, height: 150,
  rotation: 0,
  content: '',
  style: DEFAULT_SHAPE_STYLE,
  locked: false,
  visible: true,
};

export const DEFAULT_ELLIPSE_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'shape',
  shapeType: 'ellipse',
  x: 50, y: 50, width: 200, height: 150,
  rotation: 0,
  content: '',
  style: DEFAULT_SHAPE_STYLE,
  locked: false,
  visible: true,
};

export const DEFAULT_LINE_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'shape',
  shapeType: 'line',
  x: 50, y: 50, width: 200, height: 0,
  rotation: 0,
  content: '',
  style: { ...DEFAULT_SHAPE_STYLE, fillColor: 'transparent' },
  locked: false,
  visible: true,
};

export const DEFAULT_TABLE_ELEMENT: Omit<WorkbookElement, 'id'> = {
  type: 'table',
  x: 50, y: 50, width: 400, height: 200,
  rotation: 0,
  rows: 3,
  cols: 3,
  cellData: Array(3).fill(null).map(() => Array(3).fill('')),
  content: '', // Not used but required by type
  style: {
    strokeColor: '#94a3b8', // slate-400
    strokeWidth: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  locked: false,
  visible: true,
};


export const INITIAL_PAGE: Page = {
  id: crypto.randomUUID(),
  title: 'Page 1',
  elements: [
    {
      id: crypto.randomUUID(),
      type: 'text',
      x: 50,
      y: 50,
      width: 400,
      height: 60,
      rotation: 0,
      content: 'Welcome to your Workbook!',
      style: {}, // Will inherit from text style
      textStyleId: INITIAL_TEXT_STYLES[0].id,
      isTocHeading: false,
      locked: false,
      visible: true,
      nextElementId: null,
      previousElementId: null,
    },
    {
      id: crypto.randomUUID(),
      type: 'text',
      x: 50,
      y: 120,
      width: 400,
      height: 100,
      rotation: 0,
      content: 'Use the tools on the left to add elements, and the properties panel on the right to customize them. Add new pages and manage your project easily.',
      style: {}, // Will inherit from text style
      textStyleId: INITIAL_TEXT_STYLES[2].id,
      isTocHeading: false,
      locked: false,
      visible: true,
      nextElementId: null,
      previousElementId: null,
    },
  ],
  guides: [],
  masterPageId: null,
  isTocPage: false,
};

export const INITIAL_MASTER_PAGE: MasterPage = {
    id: crypto.randomUUID(),
    title: 'Default Master',
    elements: [],
    guides: [],
};
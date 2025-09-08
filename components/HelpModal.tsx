import React from 'react';
import { HelpCircleIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-slate-800 mb-2 border-b-2 border-indigo-200 pb-1">{title}</h3>
    <div className="space-y-3 text-slate-700">{children}</div>
  </div>
);

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <HelpCircleIcon className="w-8 h-8 text-indigo-500" />
            Workbook Creator Guide
          </h2>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
          <HelpSection title="Welcome!">
            <p>Welcome to your all-in-one workbook publisher! This guide will help you understand and master the powerful features available to bring your creative projects to life.</p>
          </HelpSection>

          <HelpSection title="The Workspace">
            <p>Your workspace is divided into three main areas:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Toolbar (Left):</strong> Your command center for adding content, managing pages, accessing AI tools, and exporting your project.</li>
              <li><strong>Canvas (Center):</strong> Your creative area. What you see here is what your final page will look like. You can directly click, drag, resize, and rotate elements here.</li>
              <li><strong>Panels (Right):</strong> A context-aware area with multiple tabs. It shows you options for whatever you have selected.</li>
            </ul>
          </HelpSection>
          
          <HelpSection title="The Right-Hand Panels">
             <ul className="list-disc list-inside space-y-2">
              <li><strong>Properties:</strong> Customize selected elements (size, color, fonts) or the current page (title, master page).</li>
              <li><strong>Layers:</strong> View all elements on the page as a list. Reorder, hide, lock, and select elements from here.</li>
              <li><strong>Styles:</strong> Create and manage reusable color palettes and text styles for project-wide consistency.</li>
              <li><strong>Assets:</strong> All your uploaded or sourced images are stored here for easy reuse. Just drag them onto the canvas!</li>
              <li><strong>Data:</strong> Define variables like <code>{'{{clientName}}'}</code> to create dynamic, template-based content.</li>
            </ul>
          </HelpSection>

          <HelpSection title="Core Design Tools">
            <p><strong>Selecting Elements:</strong> Click an element to select it. Hold <kbd className="font-sans bg-slate-200 rounded px-1.5 py-0.5 text-sm">Shift</kbd> and click to select multiple elements.</p>
            <p><strong>Grouping:</strong> After selecting multiple elements, a "Group" button will appear in the Properties Panel. Grouped elements move, resize, and rotate as a single unit.</p>
          </HelpSection>

          <HelpSection title="Professional Layout Features">
            <p><strong>Master Pages:</strong> Use the "View" toggle in the toolbar to switch to "Edit Masters" mode. Design layouts with headers, footers, or page numbers (using <code>{'{{pageNumber}}'}</code>) that can be applied to multiple pages for consistency.</p>
            <p><strong>Print Presets:</strong> Choose a preset like "Amazon KDP" to automatically set the correct page size, bleed, and dynamic, page-count-aware margins for professional printing.</p>
            <p><strong>Rulers & Guides:</strong> Toggle rulers and drag guides from them to snap elements for pixel-perfect alignment.</p>
            <p><strong>Text Flow:</strong> For long-form text, select a text box and click the link icon at the bottom to flow overflowing text into another text box.</p>
          </HelpSection>
          
           <HelpSection title="AI-Powered Tools">
            <p><strong>AI Design:</strong> The most powerful AI feature. Provide raw text and a style description (e.g., "modern and minimalist") to generate a fully designed page layout instantly.</p>
            <p><strong>AI Helper:</strong> Stuck for ideas? This tool can generate worksheet questions and content based on a topic you provide.</p>
             <p><strong>Marketing Assistant:</strong> Once your workbook is done, use this tool to generate social media posts, blog posts, or newsletters to promote it.</p>
          </HelpSection>
          
          <HelpSection title="Saving & Exporting">
             <p><strong>Automatic Saving:</strong> All your work is automatically saved into projects, which you can manage from the "Home" dashboard.</p>
             <p><strong>Import/Export Project:</strong> Use the buttons in the "Project" section to save a complete backup of your workbook as a <code>.workbook</code> file or to import a file from a colleague.</p>
             <p><strong>Advanced Export:</strong> The "Export..." button lets you choose your format (PDF, JPG, PNG), page range, and image quality for the final output. The PDF export supports interactive features like hyperlinks and fillable form fields.</p>
          </HelpSection>

        </div>

        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg sticky bottom-0">
          <button onClick={onClose} className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
import React, { useState } from 'react';
import { generateStyledWorksheetLayout, StyledWorksheet } from '../services/geminiService';
import { LayoutTemplateIcon } from './icons';
import type { PublishingPreset } from '../types';

interface AiFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyLayout: (content: StyledWorksheet) => void;
  publishingPreset: PublishingPreset;
  calculatedMargins: { top: number, bottom: number, inside: number, outside: number };
}

const AiFormatModal: React.FC<AiFormatModalProps> = ({ isOpen, onClose, onApplyLayout, publishingPreset, calculatedMargins }) => {
  const [text, setText] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designedContent, setDesignedContent] = useState<StyledWorksheet | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to format.');
      return;
    }
    if (!styleDescription.trim()) {
      setError('Please provide a style description.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setDesignedContent(null);
    try {
      const content = await generateStyledWorksheetLayout(text, styleDescription, publishingPreset, calculatedMargins);
      if (content) {
        setDesignedContent(content);
      } else {
        setError('Failed to generate layout. The AI may not have been able to process the request. Please try again.');
      }
    } catch (e) {
      setError('An error occurred. Check your API key and network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyLayoutToPage = () => {
    if (designedContent) {
      onApplyLayout(designedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state on close
    setText('');
    setStyleDescription('');
    setDesignedContent(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutTemplateIcon className="w-6 h-6 text-indigo-500" />
            AI Page Designer
          </h2>
        </div>
        
        <div className="p-6 space-y-4 flex-grow flex flex-col overflow-y-auto">
          {!designedContent && (
            <>
              <p className="text-slate-600">Provide your raw text and a description of the desired style. The AI will generate a complete page layout for you.</p>
              <div className="grid grid-cols-2 gap-4 flex-grow">
                 <div className="flex flex-col">
                    <label className="font-semibold text-slate-700 mb-1">Raw Content</label>
                    <textarea
                        placeholder="Paste your raw text, notes, or content here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none flex-grow resize-none"
                        disabled={isLoading}
                    />
                 </div>
                 <div className="flex flex-col">
                    <label className="font-semibold text-slate-700 mb-1">Style Description</label>
                    <textarea
                        placeholder="e.g., 'Modern and clean for a corporate workbook, using a blue color scheme.' or 'Fun and playful for a kids worksheet, with big friendly fonts.'"
                        value={styleDescription}
                        onChange={(e) => setStyleDescription(e.target.value)}
                        className="w-full h-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none flex-grow resize-none"
                        disabled={isLoading}
                    />
                 </div>
              </div>
               {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </>
          )}

          {isLoading && (
            <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <p className="text-slate-600">Designing your page... this may take a moment.</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mt-4"></div>
            </div>
          )}

          {designedContent && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">{designedContent.title}</h3>
              <p className="text-slate-600 text-sm bg-slate-50 p-2 rounded-md">Here's a preview of the generated layout. Click "Create Page" to add it to your workbook.</p>
              <div className="border p-3 rounded-md max-h-[50vh] overflow-y-auto bg-slate-100">
                  <div className="relative bg-white shadow-inner" style={{ width: `${publishingPreset.width/2}px`, height: `${publishingPreset.height/2}px`, transform: 'scale(1)', transformOrigin: 'top left'}}>
                    {designedContent.items.map((item, index) => (
                      <div key={index} style={{
                          position: 'absolute',
                          left: item.x / 2,
                          top: item.y / 2,
                          width: item.width / 2,
                          height: item.height / 2,
                          fontSize: (item.style.fontSize || 16) / 2,
                          color: item.style.color,
                          fontWeight: item.style.fontWeight,
                          textAlign: item.style.textAlign,
                          border: '1px solid #e2e8f0'
                      }}>
                        {item.type === 'checkbox' && '☐ '}
                        {item.content}
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex justify-between items-center gap-3 bg-slate-50 border-t rounded-b-lg">
          <div>
            {designedContent && (
                <button onClick={() => setDesignedContent(null)} className="text-sm text-indigo-600 hover:underline">
                    &larr; Back to editor
                </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300" disabled={isLoading}>
              Cancel
            </button>
            {designedContent ? (
              <button onClick={handleApplyLayoutToPage} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                  Create Page
              </button>
            ) : (
              <button onClick={handleGenerate} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center gap-2" disabled={isLoading}>
                  <LayoutTemplateIcon className="w-5 h-5"/> Generate Design
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiFormatModal;
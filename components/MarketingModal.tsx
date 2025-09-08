import React, { useState } from 'react';
import { generateMarketingContent } from '../services/geminiService';
import { MegaphoneIcon } from './icons';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbookContent: string;
}

type ContentType = 'social' | 'blog' | 'newsletter';

const MarketingModal: React.FC<MarketingModalProps> = ({ isOpen, onClose, workbookContent }) => {
  const [contentType, setContentType] = useState<ContentType>('social');
  const [targetAudience, setTargetAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    try {
      const content = await generateMarketingContent(workbookContent, contentType, targetAudience);
      if (content) {
        setGeneratedContent(content);
      } else {
        setError('Failed to generate content. The AI may not have been able to process the request. Please try again.');
      }
    } catch (e) {
      setError('An error occurred. Check your API key and network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      alert('Marketing content copied to clipboard!');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setGeneratedContent(null);
    setError(null);
    setTargetAudience('');
    setContentType('social');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MegaphoneIcon className="w-6 h-6 text-indigo-500" />
            AI Marketing Assistant
          </h2>
        </div>
        
        <div className="p-6 space-y-4 flex-grow flex flex-col overflow-y-auto">
          <p className="text-slate-600">Generate promotional content based on your workbook. The AI has already summarized your content to work from.</p>
          
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">1. Choose Content Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['social', 'blog', 'newsletter'] as ContentType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`py-2 px-4 rounded-md font-semibold text-sm capitalize transition-colors ${contentType === type ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300'}`}
                >
                  {type === 'social' ? 'Social Media' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="targetAudience" className="font-semibold text-slate-700">2. Define Target Audience (Optional)</label>
            <input
              id="targetAudience"
              type="text"
              placeholder="e.g., 7th-grade science teachers, busy parents..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              disabled={isLoading}
            />
          </div>

          <button 
            onClick={handleGenerate} 
            className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 font-semibold" 
            disabled={isLoading || !workbookContent}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Generate Marketing Content'
            )}
          </button>
          {!workbookContent && <p className="text-center text-sm text-yellow-600">Your workbook must contain some text content to use this feature.</p>}
          
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {generatedContent && (
            <div className="space-y-3 pt-4">
              <h3 className="text-lg font-bold text-slate-800">Generated Content:</h3>
              <textarea
                readOnly
                value={generatedContent}
                className="w-full h-48 p-3 border rounded-md bg-slate-50 text-slate-800 resize-none"
              />
              <button onClick={handleCopyToClipboard} className="bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700">
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={handleClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300" disabled={isLoading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingModal;
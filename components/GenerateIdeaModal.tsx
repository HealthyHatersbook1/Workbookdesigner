

import React, { useState } from 'react';
import { generateWorksheetIdeas, GeneratedContent } from '../services/geminiService';
import type { Page, WorkbookElement } from '../types';
import { SparklesIcon } from './icons';
import { DEFAULT_TEXT_STYLE } from '../constants';

interface GenerateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  addElementsToPage: (elements: Omit<WorkbookElement, 'id'>[]) => void;
}

const GenerateIdeaModal: React.FC<GenerateIdeaModalProps> = ({ isOpen, onClose, addElementsToPage }) => {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  if (!isOpen) return null;
  
  const handleGenerate = async () => {
    if (!topic.trim()) {
        setError('Please enter a topic.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    try {
        const content = await generateWorksheetIdeas(topic);
        if (content) {
            setGeneratedContent(content);
        } else {
            setError('Failed to generate content. Please try again.');
        }
    } catch (e) {
        setError('An error occurred. Check your API key and network connection.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddContentToPage = () => {
    if (!generatedContent) return;
    
    const elements: Omit<WorkbookElement, 'id'>[] = [];
    let currentY = 50;

    // Title
    // FIX: Added missing 'rotation' property.
    elements.push({
      type: 'text', x: 50, y: currentY, width: 700, height: 60, rotation: 0,
      content: generatedContent.title,
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 32, fontWeight: 'bold' },
    });
    currentY += 80;

    // Introduction
    // FIX: Added missing 'rotation' property.
    elements.push({
      type: 'text', x: 50, y: currentY, width: 700, height: 100, rotation: 0,
      content: generatedContent.introduction,
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 16 },
    });
    currentY += 120;

    // Questions
    generatedContent.questions.forEach(q => {
      let questionContent = `${q.question_text}`;
      if (q.question_type === 'multiple_choice' && q.options) {
        questionContent += `\n` + q.options.map(opt => `  - ${opt}`).join('\n');
      }
      
      // FIX: Added missing 'rotation' property.
      elements.push({
        type: 'text', x: 50, y: currentY, width: 700, height: 120, rotation: 0,
        content: questionContent,
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 16 },
      });
      currentY += 140;
    });

    addElementsToPage(elements);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
            AI Worksheet Generator
          </h2>
        </div>
        
        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
          {!generatedContent && (
            <>
              <p className="text-slate-600">Enter a topic below, and our AI will generate a title, introduction, and a set of questions for your worksheet.</p>
              <input
                type="text"
                placeholder="e.g., The Solar System, Photosynthesis for 7th Graders"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                disabled={isLoading}
              />
              {error && <p className="text-red-500">{error}</p>}
            </>
          )}

          {isLoading && (
            <div className="text-center py-10">
              <p className="text-slate-600">Generating ideas... this may take a moment.</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mt-4"></div>
            </div>
          )}

          {generatedContent && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800">{generatedContent.title}</h3>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-md">{generatedContent.introduction}</p>
              <div className="space-y-3">
                {generatedContent.questions.map((q, index) => (
                  <div key={index} className="p-3 border rounded-md">
                    <p className="font-semibold text-slate-600">{index + 1}. {q.question_text}</p>
                    {q.options && <ul className="list-disc list-inside pl-4 mt-1 text-slate-500">
                      {q.options.map((opt, i) => <li key={i}>{opt}</li>)}
                    </ul>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 flex justify-end gap-3 bg-slate-50 border-t rounded-b-lg">
          <button onClick={onClose} className="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300" disabled={isLoading}>
            Cancel
          </button>
          {generatedContent ? (
             <button onClick={handleAddContentToPage} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                Add to Page
            </button>
          ) : (
            <button onClick={handleGenerate} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center gap-2" disabled={isLoading}>
                <SparklesIcon className="w-5 h-5"/> Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateIdeaModal;
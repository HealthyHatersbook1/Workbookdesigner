// FIX: Add Vite client types to resolve issues with import.meta.env
/// <reference types="vite/client" />

import { GoogleGenAI, Type } from "@google/genai";
import type { PublishingPreset, WorkbookElementStyle } from '../types';

export interface GeneratedQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'fill_in_the_blank';
  options?: string[];
  answer?: string;
}

export interface GeneratedContent {
  title: string;
  introduction: string;
  questions: GeneratedQuestion[];
}

export interface StyledWorksheetItem {
  type: 'text' | 'textarea' | 'checkbox' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: WorkbookElementStyle;
  checked?: boolean;
}

export interface StyledWorksheet {
    title: string;
    items: StyledWorksheetItem[];
}


// Ensure import.meta.env.VITE_API_KEY is handled by the environment.
// Do not add UI for key management.
const API_KEY = import.meta.env?.VITE_API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully,
  // but for this context, we assume the key is present.
  console.warn("VITE_API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateWorksheetIdeas = async (topic: string): Promise<GeneratedContent | null> => {
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a worksheet about "${topic}". Include a title, a brief introduction, and 5 diverse questions (like multiple choice, fill-in-the-blank, or short answer).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            introduction: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question_text: { type: Type.STRING },
                  question_type: { type: Type.STRING, enum: ['multiple_choice', 'short_answer', 'fill_in_the_blank'] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  answer: { type: Type.STRING, nullable: true },
                },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as GeneratedContent;

  } catch (error) {
    console.error("Error generating worksheet ideas:", error);
    return null;
  }
};

export const generateStyledWorksheetLayout = async (text: string, styleDescription: string, preset: PublishingPreset, margins: { top: number, bottom: number, inside: number, outside: number }): Promise<StyledWorksheet | null> => {
  if (!API_KEY) {
    throw new Error("API Key is not configured.");
  }
  try {
    // A simplification for the AI, assuming left/right is inside/outside for a single page view
    const leftMargin = margins.inside; 
    const rightMargin = margins.outside;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert graphic designer creating a worksheet page.
      
      **Canvas Dimensions:**
      - Width: ${preset.width}px
      - Height: ${preset.height}px
      
      **Safe Margins (Content Area):**
      - Place content starting from X=${leftMargin} up to X=${preset.width - rightMargin}.
      - Place content starting from Y=${margins.top} up to Y=${preset.height - margins.bottom}.
      - ALL content must be placed within this safe zone.
      
      **Design Task:**
      Based on the provided raw text and style description, create a visually appealing and well-structured worksheet layout.
      
      1.  Create a suitable title for the worksheet page.
      2.  Transform the raw text into structured elements ('text', 'textarea', 'checkbox').
      3.  For each element, determine its position (x, y), size (width, height), and visual style (fontSize, color, fontWeight, fontStyle, textAlign).
      4.  The entire layout must adhere to the style description provided.
      
      **Style Description:** "${styleDescription}"
      
      **Raw Text to Format:**
      ---
      ${text}
      ---
      
      Generate a JSON object that strictly follows the provided schema. Ensure all coordinates and dimensions are within the safe margins of the canvas.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A suitable title for the worksheet page." },
            items: {
              type: Type.ARRAY,
              description: "The array of styled and positioned elements for the worksheet.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['text', 'textarea', 'checkbox'] },
                  content: { type: Type.STRING, description: "The text content for the item." },
                  x: { type: Type.INTEGER, description: "The x-coordinate of the top-left corner." },
                  y: { type: Type.INTEGER, description: "The y-coordinate of the top-left corner." },
                  width: { type: Type.INTEGER, description: "The width of the element." },
                  height: { type: Type.INTEGER, description: "The height of the element." },
                  style: {
                    type: Type.OBJECT,
                    properties: {
                      fontSize: { type: Type.INTEGER, nullable: true },
                      color: { type: Type.STRING, nullable: true },
                      fontWeight: { type: Type.STRING, enum: ['normal', 'bold'], nullable: true },
                      fontStyle: { type: Type.STRING, enum: ['normal', 'italic'], nullable: true },
                      textAlign: { type: Type.STRING, enum: ['left', 'center', 'right'], nullable: true },
                    }
                  },
                   checked: { type: Type.BOOLEAN, nullable: true, description: "For 'checkbox' type, the initial checked state." },
                },
                required: ['type', 'content', 'x', 'y', 'width', 'height', 'style']
              },
            },
          },
          required: ['title', 'items']
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as StyledWorksheet;

  } catch (error)
  {
    console.error("Error generating styled worksheet layout:", error);
    return null;
  }
};

export const generateMarketingContent = async (
    workbookContent: string,
    contentType: 'social' | 'blog' | 'newsletter',
    targetAudience: string
): Promise<string | null> => {
  if (!API_KEY) throw new Error("API Key is not configured.");

  let prompt;
  switch (contentType) {
    case 'social':
      prompt = `Generate 3 short, engaging social media posts to promote a new workbook. The posts should be suitable for platforms like Twitter, LinkedIn, or Facebook. Include relevant hashtags.`;
      break;
    case 'blog':
      prompt = `Generate a blog post (around 300 words) introducing a new workbook. It should have a catchy title and a few paragraphs explaining the workbook's value and content.`;
      break;
    case 'newsletter':
      prompt = `Generate a friendly and exciting newsletter email to announce the launch of a new workbook to a subscriber list. Include a subject line.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${prompt}
      
      **Target Audience:** ${targetAudience || 'a general audience'}.
      
      **Workbook Content Summary:**
      ---
      ${workbookContent}
      ---
      
      Generate only the text content for the marketing material.
      `,
    });
    
    return response.text;

  } catch (error) {
    console.error("Error generating marketing content:", error);
    return null;
  }
};
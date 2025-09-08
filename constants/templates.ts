import type { Template } from '../types';
import { FONT_FACES, DEFAULT_TEXT_STYLE } from '../constants';

// FIX: Added missing 'rotation' property to all template elements.
export const TEMPLATES: Template[] = [
  {
    id: 'daily-planner',
    name: 'Daily Planner',
    description: 'A clean, single-page layout to organize schedules, tasks, and notes.',
    previewImage: 'https://via.placeholder.com/300x400/e2e8f0/64748b?text=Daily+Planner',
    pages: [
      {
        title: 'Daily Planner',
        elements: [
          {
            type: 'text', x: 48, y: 48, width: 720, height: 60, rotation: 0,
            content: 'Daily Planner',
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 48, fontWeight: 'bold', fontFamily: FONT_FACES[4].value },
            locked: false, visible: true, nextElementId: null, previousElementId: null,
          },
          {
            type: 'text', x: 48, y: 120, width: 200, height: 30, rotation: 0,
            content: 'Date:',
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 24, fontWeight: 'bold' },
            locked: false, visible: true, nextElementId: null, previousElementId: null,
          },
          {
            type: 'text', x: 48, y: 180, width: 350, height: 40, rotation: 0,
            content: 'Top Priorities',
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 28, fontWeight: 'bold', fontFamily: FONT_FACES[3].value },
            locked: false, visible: true, nextElementId: null, previousElementId: null,
          },
          { type: 'checkbox', x: 48, y: 230, width: 350, height: 25, content: 'Priority 1', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          { type: 'checkbox', x: 48, y: 265, width: 350, height: 25, content: 'Priority 2', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          { type: 'checkbox', x: 48, y: 300, width: 350, height: 25, content: 'Priority 3', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          
          {
            type: 'text', x: 430, y: 180, width: 350, height: 40, rotation: 0,
            content: 'To-Do List',
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 28, fontWeight: 'bold', fontFamily: FONT_FACES[3].value },
            locked: false, visible: true, nextElementId: null, previousElementId: null,
          },
          { type: 'checkbox', x: 430, y: 230, width: 350, height: 25, content: 'Task item A', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          { type: 'checkbox', x: 430, y: 265, width: 350, height: 25, content: 'Task item B', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          { type: 'checkbox', x: 430, y: 300, width: 350, height: 25, content: 'Task item C', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },
          { type: 'checkbox', x: 430, y: 335, width: 350, height: 25, content: 'Task item D', style: {...DEFAULT_TEXT_STYLE, fontSize: 18}, checked: false, rotation: 0, locked: false, visible: true, },

          {
            type: 'text', x: 48, y: 400, width: 720, height: 40, rotation: 0,
            content: 'Notes & Thoughts',
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 28, fontWeight: 'bold', fontFamily: FONT_FACES[3].value },
            locked: false, visible: true, nextElementId: null, previousElementId: null,
          },
          {
            type: 'textarea', x: 48, y: 450, width: 720, height: 300, rotation: 0,
            content: '', style: {...DEFAULT_TEXT_STYLE, color: '#000'}, locked: false, visible: true,
          }
        ]
      }
    ]
  },
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    description: 'A classic note-taking template to help you study and retain information.',
    previewImage: 'https://via.placeholder.com/300x400/e2e8f0/64748b?text=Cornell+Notes',
    pages: [
      {
        title: 'Cornell Notes',
        elements: [
           { type: 'text', x: 48, y: 48, width: 500, height: 40, content: 'Topic / Subject:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 24, fontWeight: 'bold' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
           { type: 'text', x: 550, y: 48, width: 216, height: 40, content: 'Date:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 24, fontWeight: 'bold', textAlign: 'right' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
           { type: 'textarea', x: 250, y: 100, width: 516, height: 750, content: 'Main Notes Section...', style: { ...DEFAULT_TEXT_STYLE, fontSize: 18, color: '#6b7280' }, rotation: 0, locked: false, visible: true, },
           { type: 'textarea', x: 48, y: 100, width: 190, height: 750, content: 'Cues & Questions...', style: { ...DEFAULT_TEXT_STYLE, fontSize: 18, color: '#6b7280' }, rotation: 0, locked: false, visible: true, },
           { type: 'textarea', x: 48, y: 860, width: 718, height: 150, content: 'Summary of the key points from this page...', style: { ...DEFAULT_TEXT_STYLE, fontSize: 18, color: '#6b7280' }, rotation: 0, locked: false, visible: true, },
        ]
      }
    ]
  },
  {
    id: 'project-journal',
    name: 'Project Journal',
    description: 'A simple journal format for tracking progress on your projects.',
    previewImage: 'https://via.placeholder.com/300x400/e2e8f0/64748b?text=Project+Journal',
    pages: [
      {
        title: 'Project Journal Title Page',
        elements: [
          { type: 'text', x: 48, y: 300, width: 720, height: 80, content: 'Project Journal', style: { ...DEFAULT_TEXT_STYLE, fontSize: 64, fontWeight: 'bold', textAlign: 'center', fontFamily: FONT_FACES[4].value }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
          { type: 'text', x: 48, y: 400, width: 720, height: 40, content: '[Your Project Name Here]', style: { ...DEFAULT_TEXT_STYLE, fontSize: 24, textAlign: 'center' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
        ]
      },
      {
        title: 'Journal Entry',
        elements: [
            { type: 'text', x: 48, y: 48, width: 720, height: 40, content: 'Journal Entry', style: { ...DEFAULT_TEXT_STYLE, fontSize: 32, fontWeight: 'bold' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
            { type: 'text', x: 48, y: 100, width: 200, height: 30, content: 'Date:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 20 }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
            { type: 'text', x: 48, y: 150, width: 720, height: 30, content: 'What I worked on today:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 20, fontWeight: 'bold' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
            { type: 'textarea', x: 48, y: 190, width: 720, height: 200, content: '', style: { ...DEFAULT_TEXT_STYLE }, rotation: 0, locked: false, visible: true, },
            { type: 'text', x: 48, y: 410, width: 720, height: 30, content: 'Challenges encountered:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 20, fontWeight: 'bold' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
            { type: 'textarea', x: 48, y: 450, width: 720, height: 200, content: '', style: { ...DEFAULT_TEXT_STYLE }, rotation: 0, locked: false, visible: true, },
            { type: 'text', x: 48, y: 670, width: 720, height: 30, content: 'Next steps:', style: { ...DEFAULT_TEXT_STYLE, fontSize: 20, fontWeight: 'bold' }, rotation: 0, locked: false, visible: true, nextElementId: null, previousElementId: null, },
            { type: 'textarea', x: 48, y: 710, width: 720, height: 200, content: '', style: { ...DEFAULT_TEXT_STYLE }, rotation: 0, locked: false, visible: true, },
        ]
      }
    ]
  },
];
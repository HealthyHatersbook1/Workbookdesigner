import type { Project } from '../types';
import { INITIAL_PAGE, INITIAL_MASTER_PAGE, INITIAL_COLOR_PALETTE, INITIAL_TEXT_STYLES, PUBLISHING_PRESETS } from '../constants';

const PROJECTS_KEY = 'workbook-projects-v1';

export const projectService = {
  getProjects: (): Project[] => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (!saved) return [];
      const projects = JSON.parse(saved) as Project[];
      // Sort by last modified, newest first
      return projects.sort((a, b) => b.lastModified - a.lastModified);
    } catch (e) {
      console.error("Failed to load projects from localStorage.", e);
      return [];
    }
  },

  saveProject: (project: Project): void => {
    try {
      const projects = projectService.getProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      const updatedProject = { ...project, lastModified: Date.now() };

      if (existingIndex > -1) {
        projects[existingIndex] = updatedProject;
      } else {
        projects.unshift(updatedProject);
      }
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to save project to localStorage.", e);
    }
  },

  createProject: (name: string): Project => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: name,
      lastModified: Date.now(),
      pages: [INITIAL_PAGE],
      masterPages: [INITIAL_MASTER_PAGE],
      colorPalette: INITIAL_COLOR_PALETTE,
      textStyles: INITIAL_TEXT_STYLES,
      glossary: [],
      assetLibrary: [],
      dataVariables: [],
      publishingPresetName: PUBLISHING_PRESETS[0].name,
      bookType: 'paperback',
      currentPageIndex: 0,
      currentMasterPageIndex: 0,
    };
    projectService.saveProject(newProject);
    return newProject;
  },

  deleteProject: (projectId: string): void => {
    try {
      let projects = projectService.getProjects();
      projects = projects.filter(p => p.id !== projectId);
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to delete project from localStorage.", e);
    }
  },
  
  renameProject: (projectId: string, newName: string): void => {
    try {
        const projects = projectService.getProjects();
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if(projectIndex > -1) {
            projects[projectIndex].name = newName;
            projects[projectIndex].lastModified = Date.now();
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        }
    } catch (e) {
        console.error("Failed to rename project in localStorage.", e);
    }
  },
};
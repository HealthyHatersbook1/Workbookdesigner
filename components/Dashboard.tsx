import React, { useState } from 'react';
import type { Project } from '../types';
import { PlusIcon, TrashIcon } from './icons';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string) => void;
  onOpenProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
  onRenameProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleCreateProject = () => {
    const name = newProjectName.trim() || `Untitled Workbook ${projects.length + 1}`;
    onCreateProject(name);
    setNewProjectName('');
  };

  const handleRename = (project: Project) => {
    setRenamingProjectId(project.id);
    setTempName(project.name);
  };
  
  const handleRenameBlur = (projectId: string) => {
    if(tempName.trim()){
        onRenameProject(projectId, tempName.trim());
    }
    setRenamingProjectId(null);
    setTempName('');
  };

  return (
    <div className="bg-slate-100 min-h-screen">
      <header className="bg-white shadow-md p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800">My Workbooks</h1>
          <p className="text-slate-600 mt-1">Welcome back! Manage your projects below.</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Create a New Project</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="Enter project name..."
              className="flex-grow p-3 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={handleCreateProject}
              className="bg-indigo-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-indigo-700 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" /> Create
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Existing Projects</h2>
          {projects.length === 0 ? (
            <p className="text-slate-500 text-center py-10">You have no saved projects. Create one to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div key={project.id} className="bg-white rounded-lg shadow-md border flex flex-col group">
                  <div className="p-5 flex-grow">
                     {renamingProjectId === project.id ? (
                        <input
                            type="text"
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            onBlur={() => handleRenameBlur(project.id)}
                            onKeyDown={e => e.key === 'Enter' && handleRenameBlur(project.id)}
                            className="w-full text-lg font-bold text-slate-800 p-1 -m-1 rounded bg-indigo-50 outline-none ring-2 ring-indigo-500"
                            autoFocus
                        />
                     ) : (
                        <h3 onDoubleClick={() => handleRename(project)} className="text-lg font-bold text-slate-800 cursor-pointer" title="Double-click to rename">{project.name}</h3>
                     )}
                    <p className="text-sm text-slate-500 mt-1">
                      Last modified: {new Date(project.lastModified).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border-t flex justify-between items-center">
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Open Project
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"
                      title="Delete Project"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

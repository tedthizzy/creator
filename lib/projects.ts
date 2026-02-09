export interface Project {
  id: string;
  name: string;
  templateId: string;
  params: Record<string, any>;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'creator_projects';

export function saveProject(project: Project): void {
  const projects = loadAllProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function loadProject(id: string): Project | null {
  const projects = loadAllProjects();
  return projects.find(p => p.id === id) || null;
}

export function loadAllProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function deleteProject(id: string): void {
  const projects = loadAllProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function createProject(templateId: string, params: Record<string, any>, notes: string, name?: string): Project {
  return {
    id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || `Untitled ${new Date().toLocaleDateString()}`,
    templateId,
    params,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

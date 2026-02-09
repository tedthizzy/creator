'use client';

import { useState, type ChangeEvent } from 'react';
import { templates } from '@/templates/registry';
import type { Template, TemplateParams } from '@/templates/registry';
import type { BarChartFeature } from '@/templates/BarChart';
import { saveProject, loadAllProjects, deleteProject, createProject, type Project } from '@/lib/projects';

interface LeftPanelProps {
  selectedTemplate: Template | null;
  onTemplateChange: (template: Template) => void;
  params: TemplateParams;
  onParamsChange: (params: TemplateParams) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onLoadProject?: (project: Project) => void;
}

export default function LeftPanel({
  selectedTemplate,
  onTemplateChange,
  params,
  onParamsChange,
  notes,
  onNotesChange,
  onLoadProject,
}: LeftPanelProps) {
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState('');
  const projects = loadAllProjects();
  const handleTemplateSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const template = templates.find(t => t.id === e.target.value);
    if (template) {
      onTemplateChange(template);
      // Reset params to defaults
      const defaults: TemplateParams = {};
      template.parameters.forEach(param => {
        defaults[param.id] = param.defaultValue;
      });
      onParamsChange(defaults);
    }
  };

  const handleParamChange = (paramId: string, value: string) => {
    onParamsChange({ ...params, [paramId]: value });
  };

  // For bar chart, parse features JSON
  const features = selectedTemplate?.id === 'bar-chart' && params.features
    ? (() => {
        try {
          return JSON.parse(params.features as string) as BarChartFeature[];
        } catch {
          return [];
        }
      })()
    : [];

  const updateFeature = (index: number, field: keyof BarChartFeature, value: string | number | boolean) => {
    if (selectedTemplate?.id !== 'bar-chart') return;
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    onParamsChange({ ...params, features: JSON.stringify(updated) });
  };

  const addFeature = () => {
    if (selectedTemplate?.id !== 'bar-chart') return;
    const newFeature: BarChartFeature = { label: 'New feature', pct: 50, highlight: false };
    onParamsChange({ ...params, features: JSON.stringify([...features, newFeature]) });
  };

  const removeFeature = (index: number) => {
    if (selectedTemplate?.id !== 'bar-chart') return;
    const updated = features.filter((_, i) => i !== index);
    onParamsChange({ ...params, features: JSON.stringify(updated) });
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
      }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between"
        style={{
          borderColor: 'var(--border-default)',
        }}
      >
        <h1
          className="text-lg font-semibold"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
          }}
        >
          Creator
        </h1>
        <button
          onClick={() => setShowProjects(!showProjects)}
          className="text-sm px-2 py-1 rounded"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
          }}
        >
          {showProjects ? 'Hide' : 'Projects'}
        </button>
      </div>

      {/* Projects Panel */}
      {showProjects && (
        <div
          className="flex-shrink-0 px-4 py-3 border-b max-h-48 overflow-y-auto"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name..."
              className="flex-1 px-2 py-1 text-sm rounded"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
              }}
            />
            <button
              onClick={() => {
                if (selectedTemplate && projectName.trim()) {
                  const project = createProject(selectedTemplate.id, params, notes, projectName.trim());
                  saveProject(project);
                  setProjectName('');
                }
              }}
              disabled={!selectedTemplate || !projectName.trim()}
              className="px-2 py-1 text-xs rounded"
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent-teal)',
                border: '1px solid var(--accent-teal)',
                fontFamily: 'var(--font-serif)',
                cursor: selectedTemplate && projectName.trim() ? 'pointer' : 'not-allowed',
                opacity: selectedTemplate && projectName.trim() ? 1 : 0.5,
              }}
            >
              Save
            </button>
          </div>
          <div className="space-y-1">
            {projects.map(project => (
              <div
                key={project.id}
                className="flex items-center justify-between p-2 rounded text-sm"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <button
                  onClick={() => {
                    if (onLoadProject) onLoadProject(project);
                    setShowProjects(false);
                  }}
                  className="flex-1 text-left truncate"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
                >
                  {project.name}
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="ml-2 px-1 text-xs"
                  style={{ color: '#ef4444' }}
                >
                  ×
                </button>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                No saved projects
              </p>
            )}
          </div>
        </div>
      )}

      {/* Template Picker */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <label
          className="block text-sm mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Template
        </label>
        <select
          value={selectedTemplate?.id || ''}
          onChange={handleTemplateSelect}
          className="w-full px-3 py-2 rounded"
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
          }}
        >
          <option value="">Select a template...</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {selectedTemplate.description}
          </p>
        )}
      </div>

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selectedTemplate ? (
          selectedTemplate.id === 'bar-chart' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Features
                </h3>
                <button
                  onClick={addFeature}
                  className="px-2 py-1 text-xs rounded"
                  style={{
                    backgroundColor: 'var(--accent-bg)',
                    color: 'var(--accent-teal)',
                    border: '1px solid var(--accent-teal)',
                  }}
                >
                  + Add
                </button>
              </div>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-3 rounded space-y-2"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <input
                    type="text"
                    value={feature.label}
                    onChange={(e) => updateFeature(index, 'label', e.target.value)}
                    placeholder="Feature label"
                    className="w-full px-2 py-1 text-sm rounded"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={feature.pct}
                      onChange={(e) => updateFeature(index, 'pct', parseInt(e.target.value) || 0)}
                      placeholder="Percentage"
                      min="0"
                      max="100"
                      className="flex-1 px-2 py-1 text-sm rounded"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    />
                    <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={feature.highlight}
                        onChange={(e) => updateFeature(index, 'highlight', e.target.checked)}
                      />
                      Highlight
                    </label>
                    <button
                      onClick={() => removeFeature(index)}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedTemplate.id === 'survey-funnel' ? (
            <div className="space-y-3">
              {selectedTemplate.parameters.map(param => (
                <div key={param.id}>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                    {param.label}
                  </label>
                  <input
                    type="number"
                    value={params[param.id] ?? param.defaultValue ?? ''}
                    onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : selectedTemplate.id === 'pie-chart' ? (
            <div className="space-y-3">
              {selectedTemplate.parameters.map(param => (
                <div key={param.id}>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                    {param.label}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={params[param.id] ?? param.defaultValue ?? ''}
                    onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedTemplate.parameters.map(param => (
                <div key={param.id}>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                    {param.label}
                  </label>
                  {param.type === 'text' && (
                    <textarea
                      value={params[param.id] || param.defaultValue || ''}
                      onChange={(e) => handleParamChange(param.id, e.target.value)}
                      className="w-full px-3 py-2 rounded text-sm"
                      rows={4}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    />
                  )}
                  {param.type === 'number' && (
                    <input
                      type="number"
                      value={params[param.id] || param.defaultValue || ''}
                      onChange={(e) => handleParamChange(param.id, e.target.value)}
                      className="w-full px-3 py-2 rounded text-sm"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Select a template to configure parameters
          </p>
        )}
      </div>

      {/* Notes */}
      <div
        className="flex-shrink-0 px-4 py-3 border-t"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <label
          className="block text-sm mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes or context..."
          className="w-full px-3 py-2 rounded text-sm resize-none"
          rows={3}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-serif)',
          }}
        />
      </div>
    </div>
  );
}

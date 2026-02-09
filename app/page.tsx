'use client';

import { useState, useRef } from 'react';
import SplitPane from '@/components/SplitPane';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import { templates } from '@/templates/registry';
import type { Template, TemplateParams } from '@/templates/registry';
import type { Project } from '@/lib/projects';

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [params, setParams] = useState<TemplateParams>({});
  const [notes, setNotes] = useState('');
  const replayRef = useRef<(() => void) | null>(null);

  const handleTemplateChange = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize params with defaults
    const defaults: TemplateParams = {};
    template.parameters.forEach(param => {
      defaults[param.id] = param.defaultValue;
    });
    setParams(defaults);
  };

  const handleLoadProject = (project: Project) => {
    const template = templates.find(t => t.id === project.templateId);
    if (template) {
      setSelectedTemplate(template);
      setParams(project.params);
      setNotes(project.notes);
    }
  };

  const handleReplay = () => {
    if (replayRef.current) {
      replayRef.current();
    }
  };

  return (
    <SplitPane
      left={
        <LeftPanel
          selectedTemplate={selectedTemplate}
          onTemplateChange={handleTemplateChange}
          params={params}
          onParamsChange={setParams}
          notes={notes}
          onNotesChange={setNotes}
          onLoadProject={handleLoadProject}
        />
      }
      right={
        <RightPanel
          selectedTemplate={selectedTemplate}
          params={params}
          onReplay={handleReplay}
        />
      }
      defaultLeftWidth={400}
      minLeftWidth={300}
      maxLeftWidth={600}
    />
  );
}

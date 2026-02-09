'use client';

import { useState, useRef, type ReactNode } from 'react';
import { useRecorder } from './useRecorder';
import type { Template, TemplateParams } from '@/templates/registry';
import type { BarChartFeature, BarChartHandle } from '@/templates/BarChart';

interface RightPanelProps {
  selectedTemplate: Template | null;
  params: TemplateParams;
  onReplay?: () => void;
}

export default function RightPanel({ selectedTemplate, params, onReplay }: RightPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const barChartRef = useRef<BarChartHandle>(null);
  const [recording, setRecording] = useState(false);
  const { startRecording, stopRecording } = useRecorder(svgRef);

  const handleExport = async () => {
    setRecording(true);
    startRecording();
    
    // Trigger replay if available
    if (barChartRef.current) {
      barChartRef.current.replay();
    } else if (onReplay) {
      onReplay();
    }
    
    // Wait for animation to complete (rough estimate: 4 seconds)
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    await stopRecording();
    setRecording(false);
  };

  // Render the selected template
  const renderTemplate = (): ReactNode => {
    if (!selectedTemplate) {
      return (
        <div className="flex items-center justify-center h-full">
          <p style={{ color: 'var(--text-muted)' }}>Select a template to preview</p>
        </div>
      );
    }

    if (selectedTemplate.id === 'bar-chart') {
      const TemplateComponent = selectedTemplate.component;
      let features: BarChartFeature[] = [];
      
      try {
        features = JSON.parse(params.features as string || '[]') as BarChartFeature[];
      } catch {
        features = [];
      }

      if (features.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-muted)' }}>Add features to see preview</p>
          </div>
        );
      }

      return (
        <TemplateComponent
          ref={barChartRef}
          features={features}
          onReplay={() => {
            if (barChartRef.current) barChartRef.current.replay();
          }}
          onExport={handleExport}
          svgRef={svgRef}
        />
      );
    }

    // Generic template renderer
    const TemplateComponent = selectedTemplate.component;
    return <TemplateComponent {...params} onReplay={onReplay} onExport={handleExport} />;
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Toolbar */}
      {selectedTemplate && (
        <div
          className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between"
          style={{
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {selectedTemplate.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (barChartRef.current) barChartRef.current.replay();
                else if (onReplay) onReplay();
              }}
              disabled={recording}
              className="px-3 py-1.5 text-sm rounded transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                cursor: recording ? 'not-allowed' : 'pointer',
                opacity: recording ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!recording) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = 'var(--accent-teal)';
                }
              }}
              onMouseLeave={(e) => {
                if (!recording) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
            >
              ↻ Replay
            </button>
            <button
              onClick={handleExport}
              disabled={recording}
              className="px-3 py-1.5 text-sm rounded transition-colors"
              style={{
                backgroundColor: recording
                  ? 'var(--accent-bg)'
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${recording ? 'var(--accent-teal)' : 'rgba(255,255,255,0.15)'}`,
                color: recording ? 'var(--accent-teal)' : 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                cursor: recording ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!recording) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
                  e.currentTarget.style.borderColor = 'var(--accent-teal)';
                }
              }}
              onMouseLeave={(e) => {
                if (!recording) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
            >
              {recording ? '● Recording…' : 'Export 4K'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Canvas */}
      <div className="flex-1 overflow-hidden relative">
        {renderTemplate()}
      </div>
    </div>
  );
}

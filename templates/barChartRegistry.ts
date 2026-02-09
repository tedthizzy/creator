import BarChart, { type BarChartFeature } from './BarChart';
import type { Template, TemplateParameter } from './registry';

export const barChartTemplate: Template = {
  id: 'bar-chart',
  name: 'Bar Chart',
  description: 'Animated bar chart with percentage values',
  parameters: [
    {
      id: 'features',
      label: 'Features',
      type: 'text',
      defaultValue: JSON.stringify([
        { label: 'Auto repeat-offender blocking', pct: 89, highlight: true },
        { label: 'Manual repeat-offender controls', pct: 87, highlight: true },
        { label: 'Media integrity check', pct: 86, highlight: false },
        { label: 'Engagement-bait filter', pct: 84, highlight: false },
        { label: 'One-tap "hide similar"', pct: 84, highlight: false },
        { label: 'Deception detector', pct: 83, highlight: false },
      ] as BarChartFeature[]),
    },
  ],
  component: BarChart,
};

export const templates: Template[] = [barChartTemplate];

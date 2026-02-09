import SurveyFunnel from './SurveyFunnel';
import PieChart from './PieChart';
import BarChart, { type BarChartFeature } from './BarChart';

export interface TemplateParameter {
  id: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select';
  defaultValue: any;
  options?: { label: string; value: any }[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  parameters: TemplateParameter[];
  component: React.ComponentType<any>;
}

export interface TemplateParams {
  [key: string]: any;
}

// Bar Chart Template
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

// Survey Funnel Template
export const surveyFunnelTemplate: Template = {
  id: 'survey-funnel',
  name: 'Survey Funnel',
  description: 'Animated funnel with three values',
  parameters: [
    {
      id: 'topValue',
      label: 'Top Value',
      type: 'number',
      defaultValue: 8178,
    },
    {
      id: 'middleValue',
      label: 'Middle Value',
      type: 'number',
      defaultValue: 1043,
    },
    {
      id: 'bottomValue',
      label: 'Bottom Value',
      type: 'number',
      defaultValue: 771,
    },
  ],
  component: SurveyFunnel,
};

// Pie Chart Template
export const pieChartTemplate: Template = {
  id: 'pie-chart',
  name: 'Pie Chart',
  description: 'Animated pie chart with percentage',
  parameters: [
    {
      id: 'percent',
      label: 'Percentage',
      type: 'number',
      defaultValue: 5.4,
    },
  ],
  component: PieChart,
};

export const templates: Template[] = [
  barChartTemplate,
  surveyFunnelTemplate,
  pieChartTemplate,
];

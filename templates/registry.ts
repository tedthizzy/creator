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


export interface Persona {
  id: string;
  name: string;
  description: string; // Acts as the System Prompt
}

export interface Style {
  id: string;
  name: string;
  description: string; // Appended to the user prompt
}

export interface LogEntry {
  id: string;
  timestamp: string;
  model: string;
  personaName: string;
  styles: string[];
  input: string;
  fullPrompt: string;
  response: string;
  image?: string; // Data URL
}

export enum AppTab {
  GENERATOR = 'GENERATOR',
  HISTORY = 'HISTORY',
  CONFIG = 'CONFIG'
}

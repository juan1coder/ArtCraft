
import JSZip from 'jszip';
import { LogEntry, Persona, Style } from '../types';

// --- Text Formatters ---

export const generateTxtLog = (history: LogEntry[]): string => {
  return history.map(entry => `
================================================================================
ID: ${entry.id}
TIMESTAMP: ${entry.timestamp}
MODEL: ${entry.model}
PERSONA: ${entry.personaName}
STYLES: ${entry.styles.join(', ') || 'None'}
IMAGE_ATTACHED: ${entry.image ? 'YES' : 'NO'}
================================================================================
[INPUT PROMPT]
${entry.fullPrompt}

[OUTPUT RESULT]
${entry.response}
================================================================================
`).join('\n');
};

export const generateTomlLog = (history: LogEntry[]): string => {
  // Simple manual TOML generator
  let toml = `# ArtGen Studio Session Log\n# Exported: ${new Date().toISOString()}\n\n`;
  
  history.forEach((entry) => {
    toml += `[[entries]]\n`;
    toml += `id = "${entry.id}"\n`;
    toml += `timestamp = "${entry.timestamp}"\n`;
    toml += `model = "${entry.model}"\n`;
    toml += `persona = "${entry.personaName}"\n`;
    toml += `styles = ${JSON.stringify(entry.styles)}\n`;
    toml += `has_image = ${!!entry.image}\n`;
    // Use literal strings for multi-line text if possible, defaulting to basic string escaping for safety
    toml += `input = ${JSON.stringify(entry.input)}\n`;
    toml += `full_prompt = ${JSON.stringify(entry.fullPrompt)}\n`;
    toml += `response = ${JSON.stringify(entry.response)}\n\n`;
  });
  
  return toml;
};

// --- Code Generators (For Hard-wiring) ---

export const generatePersonaCode = (personas: Persona[]): string => {
  const arrayContent = personas.map(p => `  {
    id: '${p.id}',
    name: '${p.name.replace(/'/g, "\\'")}',
    description: ${JSON.stringify(p.description)}
  }`).join(',\n');

  return `import { Persona } from '../types';

export const DEFAULT_PERSONAS: Persona[] = [
${arrayContent}
];`;
};

export const generateStyleCode = (styles: Style[]): string => {
  const arrayContent = styles.map(s => `  {
    id: '${s.id}',
    name: '${s.name.replace(/'/g, "\\'")}',
    description: ${JSON.stringify(s.description)}
  }`).join(',\n');

  return `import { Style } from '../types';

export const DEFAULT_STYLES: Style[] = [
${arrayContent}
];`;
};

// --- Zip Logic ---

export const downloadAllAsZip = async (history: LogEntry[]) => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 1. Full JSON Dump (excluding huge base64 if desired, but keeping for now)
  zip.file('history.json', JSON.stringify(history, null, 2));
  
  // 2. Full TOML Dump
  zip.file('history.toml', generateTomlLog(history));
  
  // 3. Full TXT Dump
  zip.file('history.txt', generateTxtLog(history));

  // 4. Individual Log Files folder
  const logsFolder = zip.folder("individual_logs");
  if (logsFolder) {
    history.forEach(entry => {
      // Sanitize filename
      const safeName = (entry.input || "multimodal_input").substring(0, 30).replace(/[^a-z0-9]/gi, '_');
      const fileName = `${entry.id}_${safeName}.txt`;
      
      const content = `TIMESTAMP: ${entry.timestamp}
MODEL: ${entry.model}
PERSONA: ${entry.personaName}
STYLES: ${entry.styles.join(', ')}
IMAGE: ${entry.image ? 'See attached ' + entry.id + '.png' : 'None'}

--- PROMPT ---
${entry.fullPrompt}

--- RESPONSE ---
${entry.response}
`;
      logsFolder.file(fileName, content);

      // Save image if exists
      if (entry.image) {
          try {
              const base64Data = entry.image.split(',')[1];
              logsFolder.file(`${entry.id}.png`, base64Data, {base64: true});
          } catch (e) {
              console.error("Failed to zip image for entry " + entry.id);
          }
      }
    });
  }

  // Generate and download
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ArtGen_Log_Bundle_${timestamp}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

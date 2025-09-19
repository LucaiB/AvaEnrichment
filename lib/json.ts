export function extractJson(text: string): any {
  // First try to parse the entire text as JSON
  try { 
    return JSON.parse(text); 
  } catch {}

  // Look for JSON object boundaries
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  
  if (first >= 0 && last > first) {
    const slice = text.slice(first, last + 1);
    try { 
      return JSON.parse(slice); 
    } catch (e) {
      console.log('JSON parse error:', e);
      console.log('Attempted to parse:', slice);
    }
  }

  // Look for JSON array boundaries
  const firstArray = text.indexOf('[');
  const lastArray = text.lastIndexOf(']');
  
  if (firstArray >= 0 && lastArray > firstArray) {
    const slice = text.slice(firstArray, lastArray + 1);
    try { 
      return JSON.parse(slice); 
    } catch (e) {
      console.log('JSON array parse error:', e);
      console.log('Attempted to parse:', slice);
    }
  }

  // Try to find and extract JSON from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      console.log('Code block JSON parse error:', e);
    }
  }

  // Last resort: try to clean up common issues
  let cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*[\w\s]*:\s*/, '') // Remove leading text like "Here's the JSON:"
    .trim();

  // Try to find the first complete JSON object
  const lines = cleaned.split('\n');
  let jsonStart = -1;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('{')) {
      jsonStart = i;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      if (braceCount === 0) {
        // Single line JSON
        try {
          return JSON.parse(line);
        } catch (e) {
          continue;
        }
      }
    } else if (jsonStart >= 0) {
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      
      if (braceCount === 0) {
        // Found complete JSON
        const jsonLines = lines.slice(jsonStart, i + 1);
        const jsonText = jsonLines.join('\n');
        try {
          return JSON.parse(jsonText);
        } catch (e) {
          console.log('Multi-line JSON parse error:', e);
          console.log('Attempted to parse:', jsonText);
        }
        break;
      }
    }
  }

  console.log('Failed to extract JSON from text:', text);
  throw new Error('Model did not return valid JSON. Please try again.');
}

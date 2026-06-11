// Direct OpenRouter streaming chat with automatic free-model cycling.
// Falls back through FREE_MODELS until one succeeds.

import { FREE_MODELS } from './constants';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

function getApiKey(): string {
  // Read from localStorage where the store persists settings
  try {
    const raw = localStorage.getItem('novel-studio-db');
    if (raw) return '';
  } catch { /* ignore */ }
  // Fallback: try reading from the sql.js settings key
  // Actually, settings are now in Firestore, but apiKey might be in the store
  // We'll read it from the zustand store directly via a global
  return (window as any).__OPENROUTER_API_KEY__ ?? '';
}

export function setApiKey(key: string) {
  (window as any).__OPENROUTER_API_KEY__ = key;
}

export async function streamWithFallback(
  messages: { role: string; content: string }[],
  preferredModel: string,
  onChunk: (chunk: string | null) => void,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    onChunk('Error: No OpenRouter API key configured. Add one in Settings.');
    onChunk(null);
    return '';
  }

  // Build the fallback list: preferred model first, then remaining free models
  const modelList = [preferredModel, ...FREE_MODELS.map(m => m.id).filter(id => id !== preferredModel)];

  let lastError = '';

  for (const model of modelList) {
    try {
      const result = await tryStream(model, messages, onChunk, signal);
      return result; // success
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err.message;
      // Continue to next model
    }
  }

  // All models failed
  onChunk(`Error: All models failed. Last error: ${lastError}`);
  onChunk(null);
  return '';
}

async function tryStream(
  model: string,
  messages: { role: string; content: string }[],
  onChunk: (chunk: string | null) => void,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getApiKey();
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Novel Writing Studio',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          onChunk(content);
        }
      } catch { /* skip malformed JSON chunks */ }
    }
  }

  onChunk(null); // signal done
  return fullContent;
}
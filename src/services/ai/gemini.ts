import type { AIProviderInterface, ChatMessage, GeminiModel } from './types';

export function createGeminiProvider(apiKey: string, model: GeminiModel): AIProviderInterface {
  function buildContents(messages: ChatMessage[]) {
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    let systemText = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemText += msg.content + '\n';
        continue;
      }
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const text = role === 'user' && systemText && contents.length === 0
        ? systemText + '\n' + msg.content
        : msg.content;
      if (role === 'user' && systemText && contents.length === 0) {
        systemText = '';
      }
      contents.push({ role, parts: [{ text }] });
    }

    if (contents.length === 0 && systemText) {
      contents.push({ role: 'user', parts: [{ text: systemText }] });
    }

    return contents;
  }

  async function chat(messages: ChatMessage[], jsonMode = false): Promise<string> {
    const body: Record<string, unknown> = {
      contents: buildContents(messages),
    };
    if (jsonMode) {
      body.generationConfig = { responseMimeType: 'application/json' };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  async function chatWithImage(messages: ChatMessage[], imageBase64: string, mimeType: string, jsonMode = false): Promise<string> {
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];
    let systemText = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemText += msg.content + '\n';
        continue;
      }
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: Array<Record<string, unknown>> = [];

      if (role === 'user' && systemText && contents.length === 0) {
        parts.push({ text: systemText + '\n' + msg.content });
        systemText = '';
      } else {
        parts.push({ text: msg.content });
      }

      if (msg === messages[messages.length - 1] && msg.role === 'user') {
        parts.push({
          inlineData: { mimeType, data: imageBase64 },
        });
      }

      contents.push({ role, parts });
    }

    const body: Record<string, unknown> = { contents };
    if (jsonMode) {
      body.generationConfig = { responseMimeType: 'application/json' };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  async function testConnectionFn(): Promise<boolean> {
    try {
      await chat([{ role: 'user', content: 'Say "ok"' }]);
      return true;
    } catch {
      return false;
    }
  }

  return { chat, chatWithImage, testConnection: testConnectionFn };
}

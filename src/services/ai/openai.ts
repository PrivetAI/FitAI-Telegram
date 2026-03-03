import type { AIProviderInterface, ChatMessage, OpenAIModel } from './types';

export function createOpenAIProvider(apiKey: string, model: OpenAIModel): AIProviderInterface {
  async function chat(messages: ChatMessage[], jsonMode = false): Promise<string> {
    const body: Record<string, unknown> = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  async function chatWithImage(messages: ChatMessage[], imageBase64: string, mimeType: string, jsonMode = false): Promise<string> {
    const oaiMessages = messages.map((m, i) => {
      if (m.role === 'user' && i === messages.length - 1) {
        return {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: m.content },
            { type: 'image_url' as const, image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const body: Record<string, unknown> = {
      model: 'gpt-4o',
      messages: oaiMessages,
    };
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI API error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
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

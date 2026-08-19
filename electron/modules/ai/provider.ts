export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiProvider {
  name: string;
  mode: "online" | "offline";
  complete(messages: AiMessage[]): Promise<string>;
}

/**
 * Calls any OpenAI-compatible chat completions endpoint. Covers OpenAI itself,
 * and most hosted "online" providers that mirror the OpenAI API shape
 * (Azure OpenAI, OpenRouter, Groq, etc.) - just point baseUrl at theirs.
 * The user supplies their own API key in Settings; NinjaX never ships one.
 */
export class OpenAiCompatibleProvider implements AiProvider {
  name: string;
  mode = "online" as const;

  constructor(
    private apiKey: string,
    private model: string,
    private baseUrl: string = "https://api.openai.com/v1"
  ) {
    this.name = `openai-compatible (${model})`;
  }

  async complete(messages: AiMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages }),
    });

    if (!response.ok) {
      throw new Error(`AI provider request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

/**
 * Calls Anthropic's Messages API directly (api.anthropic.com), for users who
 * want to bring their own Claude API key rather than an OpenAI-compatible one.
 */
export class AnthropicProvider implements AiProvider {
  name: string;
  mode = "online" as const;

  constructor(private apiKey: string, private model: string = "claude-sonnet-4-5") {
    this.name = `anthropic (${model})`;
  }

  async complete(messages: AiMessage[]): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content;
    const rest = messages.filter((m) => m.role !== "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: this.model, max_tokens: 2048, system, messages: rest }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text ?? "";
  }
}

/**
 * Calls a locally-running model server (Ollama by default, listening on
 * 127.0.0.1:11434) - fully offline, no data leaves the user's laptop.
 * Point baseUrl at LM Studio or any other OpenAI/Ollama-compatible local
 * server if the user runs one instead.
 */
export class OfflineOllamaProvider implements AiProvider {
  name: string;
  mode = "offline" as const;

  constructor(private model: string, private baseUrl: string = "http://127.0.0.1:11434") {
    this.name = `ollama-local (${model})`;
  }

  async complete(messages: AiMessage[]): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: false }),
    });

    if (!response.ok) {
      throw new Error(
        `Local model request failed: ${response.status}. Is Ollama running at ${this.baseUrl}?`
      );
    }

    const data = await response.json();
    return data.message?.content ?? "";
  }
}

export class UnconfiguredAiProvider implements AiProvider {
  name = "unconfigured";
  mode = "online" as const;
  async complete(): Promise<string> {
    throw new Error(
      "No AI provider configured. Add an API key (online) or point NinjaX at a local model " +
        "server (offline) in Settings, then register it via setAiProvider()."
    );
  }
}

let activeProvider: AiProvider = new UnconfiguredAiProvider();

export function setAiProvider(provider: AiProvider) {
  activeProvider = provider;
}

export function getAiProvider(): AiProvider {
  return activeProvider;
}

export async function askAi(messages: AiMessage[]): Promise<string> {
  return activeProvider.complete(messages);
}

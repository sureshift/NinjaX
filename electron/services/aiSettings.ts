import { getDb } from "../db/client";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";
import { encryptSecret, decryptSecret } from "./secureStorage";
import {
  AiProvider,
  OpenAiCompatibleProvider,
  AnthropicProvider,
  OfflineOllamaProvider,
  setAiProvider,
} from "../modules/ai/provider";

export type AiProviderConfig =
  | { kind: "openai_compatible"; apiKey: string; model: string; baseUrl?: string }
  | { kind: "anthropic"; apiKey: string; model?: string }
  | { kind: "offline_ollama"; model: string; baseUrl?: string };

const AI_PROVIDER_SETTINGS_KEY = "ai_provider_config";

export function saveAiProviderConfig(config: AiProviderConfig) {
  const db = getDb();

  // Only online providers hold a secret worth encrypting; offline/local
  // providers have nothing sensitive to protect.
  const toStore =
    config.kind === "offline_ollama" ? config : { ...config, apiKey: encryptSecret(config.apiKey) };

  db.insert(settings)
    .values({ key: AI_PROVIDER_SETTINGS_KEY, value: JSON.stringify(toStore) })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(toStore) } })
    .run();

  activateProviderFromConfig(config);
}

export function loadAiProviderConfig(): AiProviderConfig | null {
  const db = getDb();
  const row = db.select().from(settings).where(eq(settings.key, AI_PROVIDER_SETTINGS_KEY)).get();
  if (!row?.value) return null;

  const stored = JSON.parse(row.value) as AiProviderConfig;
  if (stored.kind === "offline_ollama") return stored;
  return { ...stored, apiKey: decryptSecret(stored.apiKey) };
}

/** Call once at app startup so the previously-saved provider is active immediately. */
export function restoreAiProviderOnStartup() {
  const config = loadAiProviderConfig();
  if (config) activateProviderFromConfig(config);
}

function activateProviderFromConfig(config: AiProviderConfig) {
  let provider: AiProvider;
  switch (config.kind) {
    case "openai_compatible":
      provider = new OpenAiCompatibleProvider(config.apiKey, config.model, config.baseUrl);
      break;
    case "anthropic":
      provider = new AnthropicProvider(config.apiKey, config.model);
      break;
    case "offline_ollama":
      provider = new OfflineOllamaProvider(config.model, config.baseUrl);
      break;
  }
  setAiProvider(provider);
}

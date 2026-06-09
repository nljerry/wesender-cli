import { ApiClient } from "../client.js"
import { requireConfig } from "../config.js"
import { table, success, fail, printJson, warn } from "../output.js"

interface ApiKeyInfo { id: string; name: string; lastUsedAt: string | null; createdAt: string }
interface ApiKeyCreated extends ApiKeyInfo { token: string }

export async function runApiKeysList(opts: { json: boolean }): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    const res = await client.get<{ data: ApiKeyInfo[] }>("/api-keys")
    if (opts.json) { printJson(res.data); return }
    if (res.data.length === 0) { warn("Geen API-keys gevonden."); return }
    table(
      ["ID", "Naam", "Laatste gebruik", "Aangemaakt"],
      res.data.map(k => [
        k.id.substring(0, 12) + "...",
        k.name,
        k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("nl-NL") : "Nooit",
        new Date(k.createdAt).toLocaleString("nl-NL"),
      ]),
    )
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

export async function runApiKeysCreate(name: string, opts: { json: boolean }): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    const result = await client.post<ApiKeyCreated>("/api-keys", { name })
    if (opts.json) { printJson(result); return }
    success(`API-key aangemaakt: ${result.name}`)
    console.log("")
    console.log(`  Token: ${result.token}`)
    console.log("")
    warn("Bewaar dit token veilig. Het wordt niet nogmaals getoond.")
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

export async function runApiKeysDelete(id: string): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    await client.delete(`/api-keys/${id}`)
    success(`API-key ${id} verwijderd.`)
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

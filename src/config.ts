import { homedir } from "os"
import { join } from "path"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"

export interface Config {
  apiKey:   string
  baseUrl:  string
  from?:    string   // standaard afzenderadres
}

export function getConfigPath(): string {
  return join(process.env.HOME ?? homedir(), ".wesender", "config.json")
}

export async function loadConfig(): Promise<Config | null> {
  const path = getConfigPath()
  if (!existsSync(path)) return null
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw) as Config
  } catch {
    return null
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const path = getConfigPath()
  await mkdir(join(path, ".."), { recursive: true })
  await writeFile(path, JSON.stringify(config, null, 2), "utf-8")
}

export async function requireConfig(): Promise<Config> {
  const cfg = await loadConfig()
  if (!cfg?.apiKey) {
    console.error("Geen API-key geconfigureerd. Stel in met:\n  wesender config set-key ws_live_...")
    process.exit(1)
  }
  return cfg
}

import { ApiClient } from "../client.js"
import { loadConfig } from "../config.js"
import { success, fail, info } from "../output.js"
import chalk from "chalk"

function check(label: string, ok: boolean, detail?: string): void {
  const icon = ok ? chalk.green("✓") : chalk.red("✗")
  const line = `  ${icon} ${label}`
  console.log(detail ? `${line}  ${chalk.gray(detail)}` : line)
}

export async function runDoctor(): Promise<void> {
  console.log(chalk.bold("\nWeSender CLI — Diagnostics\n"))

  // 1. Config check
  console.log(chalk.bold("Configuratie"))
  const cfg = await loadConfig()
  const hasKey = !!cfg?.apiKey
  check("API-key geconfigureerd", hasKey, hasKey ? cfg!.apiKey.substring(0, 16) + "..." : undefined)
  check("Base URL ingesteld",     !!cfg?.baseUrl, cfg?.baseUrl)

  if (!hasKey) {
    console.log("")
    info("Stel je API-key in: wesender config set-key ws_live_...")
    return
  }

  // 2. API-verbinding
  console.log("")
  console.log(chalk.bold("API-verbinding"))
  const client = new ApiClient(cfg!.apiKey, cfg!.baseUrl)
  let apiOk = false
  try {
    await client.get("/domains")
    apiOk = true
    check("Verbinding met API", true, cfg!.baseUrl)
    check("API-key geldig",     true)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Onbekend"
    check("Verbinding met API", false, msg)
    check("API-key geldig",     false, "Controleer je API-key")
  }

  // 3. Domeinen
  if (apiOk) {
    console.log("")
    console.log(chalk.bold("Domeinen"))
    try {
      const res = await client.get<{
        data: Array<{ domain: string; spfOk: boolean; dkimOk: boolean; dmarcOk: boolean }>
      }>("/domains")
      if (res.data.length === 0) {
        info("Geen domeinen. Voeg toe: wesender domains add mail.joudomein.nl")
      } else {
        for (const d of res.data) {
          const allOk = d.spfOk && d.dkimOk && d.dmarcOk
          check(d.domain, allOk, allOk ? "Volledig geverifieerd" : "Controleer SPF/DKIM/DMARC")
        }
      }
    } catch {
      info("Kon domeinen niet ophalen")
    }
  }

  console.log("")
  if (apiOk) {
    success("Alles ziet er goed uit!")
  } else {
    fail("Er zijn problemen. Los ze op en draai: wesender doctor")
  }
}

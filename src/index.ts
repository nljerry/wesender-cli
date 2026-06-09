#!/usr/bin/env node
import { Command } from "commander"
import { saveConfig, loadConfig } from "./config.js"
import { success } from "./output.js"
import { runSend }                                           from "./commands/send.js"
import { runDomainsList, runDomainsAdd, runDomainsVerify }  from "./commands/domains.js"
import { runEmailsGet, runEmailsList }                      from "./commands/emails.js"
import { runLogs }                                          from "./commands/logs.js"
import { runApiKeysList, runApiKeysCreate, runApiKeysDelete } from "./commands/api-keys.js"
import { runDoctor }                                        from "./commands/doctor.js"

const program = new Command()

program
  .name("wesender")
  .description("WeSender CLI — e-mails vanuit je terminal")
  .version("0.1.0")

// ── wesender config ────────────────────────────────────────────────
const cfg = program.command("config").description("Configuratiebeheer")

cfg.command("set-key <apiKey>")
  .description("Sla je API-key op in ~/.wesender/config.json")
  .action(async (apiKey: string) => {
    const current = await loadConfig()
    await saveConfig({ ...(current ?? { baseUrl: "https://api.wesender.nl" }), apiKey })
    success(`API-key opgeslagen: ${apiKey.substring(0, 16)}...`)
  })

cfg.command("set-from <adres>")
  .description("Sla een standaard afzenderadres op (moet geverifieerd domein zijn)")
  .action(async (from: string) => {
    const current = await loadConfig()
    if (!current?.apiKey) {
      fail("Stel eerst een API-key in: wesender config set-key ws_live_...")
      process.exit(1)
    }
    await saveConfig({ ...current, from })
    success(`Standaard afzender opgeslagen: ${from}`)
  })

cfg.command("show")
  .description("Toon huidige configuratie")
  .action(async () => {
    const current = await loadConfig()
    if (!current) { info("Geen configuratie gevonden. Gebruik: wesender config set-key ws_live_..."); return }
    console.log(`  API-key: ${current.apiKey.substring(0, 16)}...`)
    console.log(`  Base URL: ${current.baseUrl}`)
    if (current.from) console.log(`  Standaard from: ${current.from}`)
  })

// ── wesender send ──────────────────────────────────────────────────
program.command("send")
  .description("Verstuur een e-mail")
  .requiredOption("--to <adres>",      "Ontvanger (email)")
  .requiredOption("--subject <tekst>", "Onderwerp")
  .option("--from <adres>",            "Afzender (gebruik geverifieerd domein)")
  .option("--html <html>",             "HTML-inhoud van de e-mail")
  .option("--text <tekst>",            "Platte tekst (fallback)")
  .option("--json",                    "Geef JSON-output terug", false)
  .action(runSend)

// ── wesender domains ───────────────────────────────────────────────
const domains = program.command("domains").description("Domeinbeheer")

domains.command("list")
  .description("Toon alle verzendende domeinen")
  .option("--json", "JSON-output", false)
  .action(runDomainsList)

domains.command("add <domein>")
  .description("Voeg een nieuw verzendend domein toe")
  .option("--json", "JSON-output", false)
  .action(runDomainsAdd)

domains.command("verify <domein>")
  .description("Controleer de DNS-verificatiestatus van een domein")
  .action(runDomainsVerify)

// ── wesender emails ────────────────────────────────────────────────
const emails = program.command("emails").description("E-mailoverzicht")

emails.command("get <id>")
  .description("Haal details op van een specifieke e-mail")
  .option("--json", "JSON-output", false)
  .action(runEmailsGet)

emails.command("list")
  .description("Toon recent verstuurde e-mails")
  .option("--limit <n>",   "Aantal resultaten (max 100)", "50")
  .option("--status <s>",  "Filter op status: delivered|bounced|queued|failed")
  .option("--json",         "JSON-output", false)
  .action((opts: { limit: string; status?: string; json: boolean }) =>
    runEmailsList({ ...opts, limit: Number(opts.limit) })
  )

// ── wesender logs ──────────────────────────────────────────────────
program.command("logs")
  .description("Toon e-maillogboek (stream met --follow)")
  .option("--follow",      "Ververs elke 3 seconden", false)
  .option("--status <s>",  "Filter op status")
  .option("--limit <n>",   "Aantal resultaten", "50")
  .action((opts: { follow: boolean; status?: string; limit: string }) =>
    runLogs({ ...opts, limit: Number(opts.limit) })
  )

// ── wesender api-keys ──────────────────────────────────────────────
const apiKeys = program.command("api-keys").description("API-key beheer")

apiKeys.command("list")
  .description("Toon alle API-keys in je account")
  .option("--json", "JSON-output", false)
  .action(runApiKeysList)

apiKeys.command("create <naam>")
  .description("Maak een nieuwe API-key aan")
  .option("--json", "JSON-output", false)
  .action(runApiKeysCreate)

apiKeys.command("delete <id>")
  .description("Verwijder een API-key")
  .action(runApiKeysDelete)

// ── wesender doctor ────────────────────────────────────────────────
program.command("doctor")
  .description("Controleer configuratie, API-verbinding en DNS-status")
  .action(runDoctor)

program.parse()

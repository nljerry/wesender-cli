import { ApiClient } from "../client.js"
import { requireConfig } from "../config.js"
import { table, success, fail, printJson, info } from "../output.js"
import chalk from "chalk"

interface Domain {
  id:        string
  domain:    string
  spfOk:    boolean
  dkimOk:   boolean
  dmarcOk:  boolean
  verifiedAt?: string
}

interface DomainCreated extends Domain {
  dnsRecords: { spf: string; dkim: string; dmarc: string }
}

export async function listDomains(): Promise<Domain[]> {
  const cfg = await requireConfig()
  const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
  const res = await client.get<{ data: Domain[] }>("/domains")
  return res.data
}

export async function addDomain(domain: string): Promise<DomainCreated> {
  const cfg = await requireConfig()
  const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
  return client.post<DomainCreated>("/domains", { domain })
}

function statusIcon(ok: boolean): string {
  return ok ? chalk.green("✓") : chalk.red("✗")
}

export async function runDomainsList(opts: { json: boolean }): Promise<void> {
  try {
    const domains = await listDomains()
    if (opts.json) { printJson(domains); return }
    if (domains.length === 0) { info("Geen domeinen gevonden."); return }
    table(
      ["Domein", "SPF", "DKIM", "DMARC", "Status"],
      domains.map(d => [
        d.domain,
        statusIcon(d.spfOk),
        statusIcon(d.dkimOk),
        statusIcon(d.dmarcOk),
        d.spfOk && d.dkimOk && d.dmarcOk ? chalk.green("Geverifieerd") : chalk.yellow("Wacht op DNS"),
      ]),
    )
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

export async function runDomainsAdd(domain: string, opts: { json: boolean }): Promise<void> {
  try {
    const result = await addDomain(domain)
    if (opts.json) { printJson(result); return }
    success(`Domein ${result.domain} toegevoegd! Stel deze DNS-records in:`)
    console.log("")
    console.log(chalk.bold("SPF:"))
    console.log(`  Type: TXT   Naam: @   Waarde: ${result.dnsRecords.spf}`)
    console.log("")
    console.log(chalk.bold("DKIM:"))
    console.log(`  Type: TXT   Naam: wesender._domainkey`)
    console.log(`  Waarde: ${result.dnsRecords.dkim.substring(0, 60)}...`)
    console.log("")
    console.log(chalk.bold("DMARC:"))
    console.log(`  Type: TXT   Naam: _dmarc   Waarde: ${result.dnsRecords.dmarc}`)
    console.log("")
    info(`Controleer status: wesender domains verify ${result.domain}`)
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

export async function runDomainsVerify(domain: string): Promise<void> {
  try {
    const domains = await listDomains()
    const found = domains.find(d => d.domain === domain)
    if (!found) {
      fail(`Domein '${domain}' niet gevonden. Voeg eerst toe: wesender domains add ${domain}`)
      process.exit(1)
    }
    const allOk = found.spfOk && found.dkimOk && found.dmarcOk
    if (allOk) {
      success(`${domain} is volledig geverifieerd (SPF, DKIM, DMARC)`)
    } else {
      console.log(`Status voor ${chalk.bold(domain)}:`)
      console.log(`  SPF:   ${statusIcon(found.spfOk)}  ${found.spfOk ? "OK" : "Nog niet gepropageerd"}`)
      console.log(`  DKIM:  ${statusIcon(found.dkimOk)}  ${found.dkimOk ? "OK" : "Nog niet gepropageerd"}`)
      console.log(`  DMARC: ${statusIcon(found.dmarcOk)}  ${found.dmarcOk ? "OK" : "Nog niet gepropageerd"}`)
      info("DNS kan 24 uur duren om te propageren.")
    }
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

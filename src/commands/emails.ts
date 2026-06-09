import { ApiClient } from "../client.js"
import { requireConfig } from "../config.js"
import { table, fail, printJson, info } from "../output.js"
import chalk from "chalk"

interface Email {
  id:           string
  from:         string
  to:           string[]
  subject:      string
  status:       string
  createdAt:    string
  deliveredAt?: string
}

const STATUS_COLOR: Record<string, (s: string) => string> = {
  delivered: chalk.green,
  bounced:   chalk.red,
  failed:    chalk.red,
  queued:    chalk.yellow,
  sent:      chalk.cyan,
  opened:    chalk.blue,
}

function colorStatus(status: string): string {
  return (STATUS_COLOR[status] ?? chalk.gray)(status)
}

export async function runEmailsGet(id: string, opts: { json: boolean }): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    const email = await client.get<Email>(`/emails/${id}`)
    if (opts.json) { printJson(email); return }
    console.log(chalk.bold("E-mail details"))
    console.log(`  ID:        ${email.id}`)
    console.log(`  Van:       ${email.from}`)
    console.log(`  Aan:       ${email.to.join(", ")}`)
    console.log(`  Onderwerp: ${email.subject}`)
    console.log(`  Status:    ${colorStatus(email.status)}`)
    console.log(`  Verstuurd: ${new Date(email.createdAt).toLocaleString("nl-NL")}`)
    if (email.deliveredAt) {
      console.log(`  Bezorgd:   ${new Date(email.deliveredAt).toLocaleString("nl-NL")}`)
    }
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

export async function runEmailsList(opts: { limit: number; status?: string; json: boolean }): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    const res = await client.get<{ data: Email[] }>(`/emails?limit=${opts.limit}`)
    const emails = opts.status ? res.data.filter(e => e.status === opts.status) : res.data
    if (opts.json) { printJson(emails); return }
    if (emails.length === 0) { info("Geen e-mails gevonden."); return }
    table(
      ["ID", "Aan", "Onderwerp", "Status", "Verstuurd"],
      emails.map(e => [
        e.id.substring(0, 15) + "...",
        e.to[0] ?? "",
        e.subject.substring(0, 28),
        colorStatus(e.status),
        new Date(e.createdAt).toLocaleString("nl-NL"),
      ]),
    )
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

import { ApiClient } from "../client.js"
import { requireConfig } from "../config.js"
import { fail } from "../output.js"
import chalk from "chalk"

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

interface EmailEntry {
  id:        string
  to:        string[]
  subject:   string
  status:    string
  createdAt: string
}

export async function runLogs(opts: { follow: boolean; status?: string; limit: number }): Promise<void> {
  try {
    const cfg = await requireConfig()
    const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
    const seen = new Set<string>()

    const fetchAndPrint = async (): Promise<void> => {
      const res = await client.get<{ data: EmailEntry[] }>(`/emails?limit=${opts.limit}`)
      for (const email of [...res.data].reverse()) {
        if (seen.has(email.id)) continue
        seen.add(email.id)
        if (opts.status && email.status !== opts.status) continue
        const ts  = new Date(email.createdAt).toLocaleTimeString("nl-NL")
        const to  = email.to[0] ?? ""
        const sub = email.subject.substring(0, 35)
        console.log(`${chalk.gray(ts)}  ${colorStatus(email.status.padEnd(12))}  ${chalk.bold(email.id.substring(0, 15))}  ${to}  ${sub}`)
      }
    }

    await fetchAndPrint()

    if (opts.follow) {
      console.log(chalk.gray("\nWacht op nieuwe e-mails... (Ctrl+C om te stoppen)"))
      const interval = setInterval(fetchAndPrint, 3000)
      process.on("SIGINT", () => { clearInterval(interval); process.exit(0) })
      await new Promise(() => {})
    }
  } catch (err) { fail(err instanceof Error ? err.message : "Fout"); process.exit(1) }
}

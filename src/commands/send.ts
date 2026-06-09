import { ApiClient } from "../client.js"
import { requireConfig } from "../config.js"
import { success, fail, printJson, info } from "../output.js"

interface SendOptions {
  to:      string
  from?:   string
  subject: string
  html?:   string
  text?:   string
  json:    boolean
}

interface SendResult {
  id:     string
  status: string
}

export async function sendEmail(opts: SendOptions): Promise<SendResult> {
  const cfg = await requireConfig()

  // Prioriteit: --from vlag > config.from > fout
  const from = opts.from ?? cfg.from
  if (!from) {
    console.error(
      "Geen afzenderadres opgegeven.\n" +
      "Gebruik --from of sla een standaard op:\n" +
      "  wesender config set-from noreply@mail.joudomein.nl"
    )
    process.exit(1)
  }

  const client = new ApiClient(cfg.apiKey, cfg.baseUrl)
  const payload: Record<string, unknown> = { to: opts.to, subject: opts.subject, from }
  if (opts.html) payload.html = opts.html
  if (opts.text) payload.text = opts.text

  return client.post<SendResult>("/emails", payload)
}

export async function runSend(opts: SendOptions): Promise<void> {
  try {
    const result = await sendEmail(opts)
    if (opts.json) {
      printJson(result)
    } else {
      success(`E-mail verstuurd!  ID: ${result.id}  Status: ${result.status}`)
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : "Onbekende fout")
    process.exit(1)
  }
}

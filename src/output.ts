import chalk  from "chalk"
import Table  from "cli-table3"

export function success(msg: string): void {
  console.log(chalk.green("✓") + " " + msg)
}

export function fail(msg: string): void {
  console.error(chalk.red("✗") + " " + msg)
}

export function info(msg: string): void {
  console.log(chalk.cyan("→") + " " + msg)
}

export function warn(msg: string): void {
  console.warn(chalk.yellow("⚠") + " " + msg)
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2))
}

export function table(headers: string[], rows: (string | number)[][]): void {
  const t = new Table({
    head:  headers.map(h => chalk.bold(h)),
    style: { head: [], border: [] },
  })
  rows.forEach(r => t.push(r.map(String)))
  console.log(t.toString())
}

export function handleError(err: unknown): never {
  if (err instanceof Error) {
    fail(err.message)
  } else {
    fail("Onbekende fout")
  }
  process.exit(1)
}

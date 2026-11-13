import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const text = await readFile(fileURLToPath(url), 'utf8')
    return { format: 'module', source: `export default ${text}`, shortCircuit: true }
  }
  return nextLoad(url, context)
}

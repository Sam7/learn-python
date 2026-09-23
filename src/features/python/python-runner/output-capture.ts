export interface OutputCapture {
  append(chunk: string): void
  read(): string
}

export const MAX_CAPTURED_OUTPUT_CHARACTERS = 20_000

export function createOutputCapture(
  limit = MAX_CAPTURED_OUTPUT_CHARACTERS,
  label = 'Python output',
): OutputCapture {
  let value = ''
  let characterCount = 0
  let truncated = false

  return {
    append(chunk) {
      if (truncated || !chunk) return
      const remaining = Math.max(0, limit - characterCount)
      const accepted = chunk.slice(0, remaining)
      value += accepted
      characterCount += accepted.length
      if (accepted.length < chunk.length) {
        value += `\n[${label} shortened after ${limit} characters.]\n`
        truncated = true
      }
    },
    read: () => value,
  }
}

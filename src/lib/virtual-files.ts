export type VirtualFileMap = Record<string, string>

export const MAX_VIRTUAL_FILE_COUNT = 40
export const MAX_VIRTUAL_FILE_BYTES = 64 * 1024
export const MAX_VIRTUAL_WORKSPACE_BYTES = 512 * 1024

const encoder = new TextEncoder()

export function isSafeVirtualFilePath(path: string): boolean {
  if (path.length === 0 || path.length > 160 || path.startsWith('/') || path.includes('\\') || path.includes(':')) return false
  return path.split('/').every((segment) =>
    segment.length > 0
    && segment !== '.'
    && segment !== '..'
    && /^[A-Za-z0-9_][A-Za-z0-9._-]*$/.test(segment),
  )
}

export function normalizeVirtualFiles(value: unknown): VirtualFileMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}

  const files: VirtualFileMap = {}
  let totalBytes = 0
  for (const [path, content] of Object.entries(value)) {
    if (!isSafeVirtualFilePath(path) || typeof content !== 'string') continue
    const size = encoder.encode(content).byteLength
    if (size > MAX_VIRTUAL_FILE_BYTES || totalBytes + size > MAX_VIRTUAL_WORKSPACE_BYTES) continue
    files[path] = content
    totalBytes += size
    if (Object.keys(files).length >= MAX_VIRTUAL_FILE_COUNT) break
  }
  return files
}

export function nextPythonFileName(files: VirtualFileMap): string {
  let suffix = 1
  let candidate = 'new_file.py'
  while (Object.hasOwn(files, candidate)) {
    suffix += 1
    candidate = `new_file_${suffix}.py`
  }
  return candidate
}

import { describe, expect, it } from 'vitest'
import { isSafeVirtualFilePath, nextPythonFileName, normalizeVirtualFiles } from './virtual-files'

describe('virtual file boundaries', () => {
  it.each(['main.py', 'src/scores.py', 'scores-v2.json'])('accepts the relative path %s', (path) => {
    expect(isSafeVirtualFilePath(path)).toBe(true)
  })

  it.each(['', '/main.py', '../outside.py', 'src/../../outside.py', 'C:/main.py', 'src\\main.py', 'a//b.py'])('rejects unsafe path %s', (path) => {
    expect(isSafeVirtualFilePath(path)).toBe(false)
  })

  it('keeps only safe, text, bounded file entries from restored data', () => {
    expect(normalizeVirtualFiles({
      'main.py': 'print("hello")',
      '../secret.py': 'not in the workspace',
      'score.bin': new Uint8Array([1, 2]),
    })).toEqual({ 'main.py': 'print("hello")' })
  })

  it('chooses a fresh Python filename without replacing an existing file', () => {
    expect(nextPythonFileName({ 'main.py': '', 'new_file.py': '', 'new_file_2.py': '' })).toBe('new_file_3.py')
  })
})

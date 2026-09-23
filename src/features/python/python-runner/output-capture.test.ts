import { describe, expect, it } from 'vitest'
import { createOutputCapture } from './output-capture'

describe('bounded Python output capture', () => {
  it('keeps small writes in order', () => {
    const output = createOutputCapture(20)
    output.append('First\n')
    output.append('Second\n')

    expect(output.read()).toBe('First\nSecond\n')
  })

  it('truncates excessive output once and ignores later writes', () => {
    const output = createOutputCapture(8)
    output.append('12345678')
    output.append('abcdef')
    output.append('ignored')

    expect(output.read()).toBe('12345678\n[Python output shortened after 8 characters.]\n')
  })
})

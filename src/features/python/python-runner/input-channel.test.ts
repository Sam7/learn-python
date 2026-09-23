import { describe, expect, it } from 'vitest'
import { answerInput, cancelInput, createInputChannel, waitForInput } from './input-channel'

describe('input channel', () => {
  it('round-trips empty, unicode, and multiline answers', () => {
    const channel = createInputChannel()

    answerInput(channel, '🌿 noodles\nwith care')

    expect(waitForInput(channel)).toBe('🌿 noodles\nwith care')
  })

  it('returns no answer after cancellation', () => {
    const channel = createInputChannel()
    cancelInput(channel)

    expect(waitForInput(channel)).toBeUndefined()
  })
})

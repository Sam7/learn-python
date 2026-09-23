export const INPUT_CHANNEL_MAX_BYTES = 1024 * 1024

const CONTROL_WORDS = 2
const STATUS_INDEX = 0
const LENGTH_INDEX = 1

export const INPUT_STATUS = {
  idle: 0,
  waiting: 1,
  answered: 2,
  cancelled: 3,
} as const

export type InputChannel = {
  buffer: SharedArrayBuffer
  control: Int32Array
  data: Uint8Array
}

export function canUseInteractiveInput(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && typeof Atomics !== 'undefined'
    && typeof crossOriginIsolated !== 'undefined'
    && crossOriginIsolated
}

export function createInputChannel(): InputChannel {
  const buffer = new SharedArrayBuffer(
    CONTROL_WORDS * Int32Array.BYTES_PER_ELEMENT + INPUT_CHANNEL_MAX_BYTES,
  )
  return {
    buffer,
    control: new Int32Array(buffer, 0, CONTROL_WORDS),
    data: new Uint8Array(buffer, CONTROL_WORDS * Int32Array.BYTES_PER_ELEMENT),
  }
}

export function answerInput(channel: InputChannel, answer: string): void {
  const bytes = new TextEncoder().encode(answer)
  if (bytes.length > channel.data.byteLength) {
    cancelInput(channel)
    return
  }

  channel.data.fill(0)
  channel.data.set(bytes)
  Atomics.store(channel.control, LENGTH_INDEX, bytes.length)
  Atomics.store(channel.control, STATUS_INDEX, INPUT_STATUS.answered)
  Atomics.notify(channel.control, STATUS_INDEX)
}

export function cancelInput(channel: InputChannel): void {
  Atomics.store(channel.control, STATUS_INDEX, INPUT_STATUS.cancelled)
  Atomics.notify(channel.control, STATUS_INDEX)
}

export function waitForInput(channel: InputChannel): string | undefined {
  while (Atomics.load(channel.control, STATUS_INDEX) === INPUT_STATUS.waiting) {
    Atomics.wait(channel.control, STATUS_INDEX, INPUT_STATUS.waiting)
  }

  const status = Atomics.load(channel.control, STATUS_INDEX)
  if (status === INPUT_STATUS.cancelled) return undefined

  const length = Atomics.load(channel.control, LENGTH_INDEX)
  const answer = new TextDecoder().decode(channel.data.slice(0, length))
  Atomics.store(channel.control, STATUS_INDEX, INPUT_STATUS.idle)
  return answer
}

import { describe, expect, it } from 'vitest'
import { lampStyle } from './lamp'

describe('lampStyle', () => {
  it('derives stable visual properties from a seed without private text', () => {
    const first = lampStyle(123456)
    const second = lampStyle(123456)
    expect(first).toEqual(second)
    const styles = first as Record<string, string>
    expect(styles['--lamp-x']).toMatch(/^\d+(\.\d+)?%$/)
    expect(styles['--lamp-drift']).toMatch(/^-?\d+px$/)
  })
})

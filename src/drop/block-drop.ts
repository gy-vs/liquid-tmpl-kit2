import { Emitter, SimpleEmitter } from '../emitters'
import { isString, toSafeString } from '../util'
import { Drop } from './drop'

export class BlockDrop extends Drop {
  constructor (
    // the block render from layout template
    private superBlockRender: (emitter: Emitter) => IterableIterator<unknown> | string = () => '',
    // mark `block.super` output as safe so it's not escaped again on output
    private outputEscapeEnabled = false
  ) {
    super()
  }
  /**
   * Provide parent access in child block by
   * {{ block.super }}
   */
  public * super (): IterableIterator<unknown> {
    const emitter = new SimpleEmitter()
    yield this.superBlockRender(emitter)
    const html = emitter.buffer
    return this.outputEscapeEnabled && isString(html) ? toSafeString(html) : html
  }
}

import { Liquid, TopLevelToken, Emitter, Value, TagToken, Context, Tag } from '..'
import { applyOutputEscape, Arguments } from '../template'
import { toSafeString } from '../util/safe-string'

export default class extends Tag {
  private value?: Value
  private outputEscape = false

  constructor (token: TagToken, remainTokens: TopLevelToken[], liquid: Liquid) {
    super(token, remainTokens, liquid)
    this.tokenizer.skipBlank()
    if (!this.tokenizer.end()) {
      this.value = new Value(this.tokenizer.readFilteredValue(), this.liquid)
      this.outputEscape = applyOutputEscape(this.value, liquid)
    }
  }
  * render (ctx: Context, emitter: Emitter): Generator<unknown, void, unknown> {
    if (!this.value) return
    const val = yield this.value.value(ctx, false)
    emitter.write(this.outputEscape ? toSafeString(val) : val)
  }

  public * arguments (): Arguments {
    if (this.value) {
      yield this.value
    }
  }
}

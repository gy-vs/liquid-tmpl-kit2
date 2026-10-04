import { TemplateImpl, Template } from '../template'
import { SafeString } from '../util/safe-string'
import { HTMLToken } from '../tokens'
import { Context } from '../context'
import { Emitter } from '../emitters'

export class HTML extends TemplateImpl<HTMLToken> implements Template {
  private str: string
  private safeStr?: SafeString
  public constructor (token: HTMLToken) {
    super(token)
    this.str = token.getContent()
  }
  public * render (ctx: Context, emitter: Emitter): IterableIterator<void> {
    if (ctx.opts.outputEscape && this.str !== '') {
      // template literals are trusted content, mark them safe to avoid
      // being escaped again when captured or passed to layout blocks
      emitter.write(this.safeStr || (this.safeStr = new SafeString(this.str)))
    } else {
      emitter.write(this.str)
    }
  }
}

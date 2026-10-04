import { Value } from './value'
import { Arguments, Template, TemplateImpl } from '../template'
import { Context } from '../context/context'
import { Emitter } from '../emitters/emitter'
import { OutputToken } from '../tokens/output-token'
import { Tokenizer } from '../parser'
import { Liquid } from '../liquid'
import { Filter } from './filter'
import { FilterImpl } from './filter-impl-options'
import { isSafeString, toSafeString } from '../util/safe-string'
import { FilterToken } from '../tokens'

/**
 * Append the filter for the `outputEscape` option to the value, unless it's
 * already ended by a `raw` filter. Returns `true` if `outputEscape` is
 * enabled, in which case the rendered value is safe to be written as-is.
 */
export function applyOutputEscape (value: Value, liquid: Liquid): boolean {
  const outputEscape = liquid.options.outputEscape
  if (!outputEscape) return false
  const filters = value.filters
  if (!filters[filters.length - 1]?.raw) {
    const token = new FilterToken(toString.call(outputEscape), [], '', 0, 0)
    const filter = new Filter(token, {
      raw: false,
      handler: function (this: FilterImpl, val: any) {
        // already escaped/trusted template output, don't escape twice
        return isSafeString(val) ? val : outputEscape.call(this, val)
      }
    }, liquid)
    filter.outputEscape = true
    filters.push(filter)
  }
  return true
}

export class Output extends TemplateImpl<OutputToken> implements Template {
  value: Value
  private outputEscape: boolean
  public constructor (token: OutputToken, liquid: Liquid) {
    super(token)
    const tokenizer = new Tokenizer(token.input, liquid.options.operators, token.file, token.contentRange)
    this.value = new Value(tokenizer.readFilteredValue(), liquid)
    this.outputEscape = applyOutputEscape(this.value, liquid)
  }
  public * render (ctx: Context, emitter: Emitter): IterableIterator<unknown> {
    const val = yield this.value.value(ctx, false)
    emitter.write(this.outputEscape ? toSafeString(val) : val)
  }

  public * arguments (): Arguments {
    yield this.value
  }
}

import { Value } from './value'
import { Arguments, Template, TemplateImpl } from '../template'
import { Context } from '../context/context'
import { Emitter } from '../emitters/emitter'
import { OutputToken } from '../tokens/output-token'
import { Tokenizer } from '../parser'
import { Liquid } from '../liquid'
import { Filter } from './filter'
import { FilterToken } from '../tokens'
import { isSafeString } from '../util'
import { FilterHandler, FilterImpl } from './filter-impl-options'

export class Output extends TemplateImpl<OutputToken> implements Template {
  value: Value
  public constructor (token: OutputToken, liquid: Liquid) {
    super(token)
    const tokenizer = new Tokenizer(token.input, liquid.options.operators, token.file, token.contentRange)
    this.value = new Value(tokenizer.readFilteredValue(), liquid)
    appendOutputEscape(this.value, liquid)
  }
  public * render (ctx: Context, emitter: Emitter): IterableIterator<unknown> {
    const val = yield this.value.value(ctx, false)
    emitter.write(val)
  }

  public * arguments (): Arguments {
    yield this.value
  }
}

/**
 * Append the `outputEscape` filter to the value's filter chain, unless the
 * last filter is `raw`. Values already marked as safe (template output like
 * `{% capture %}` or `block.super`) are passed through without being
 * escaped again, everything else is escaped by the configured `outputEscape`.
 */
export function appendOutputEscape (value: Value, liquid: Liquid): void {
  const filters = value.filters
  const outputEscape = liquid.options.outputEscape
  if (filters[filters.length - 1]?.raw || !outputEscape) return
  const token = new FilterToken(toString.call(outputEscape), [], '', 0, 0)
  filters.push(new Filter(token, createOutputEscapeHandler(outputEscape), liquid))
}

function createOutputEscapeHandler (outputEscape: (value: any) => string): FilterHandler {
  return function (this: FilterImpl, value: any) {
    if (isSafeString(value)) return value.toString()
    return outputEscape.call(this, value)
  }
}

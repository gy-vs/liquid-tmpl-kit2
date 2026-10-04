import { Liquid, TagToken, TopLevelToken, Tag } from '..'
import { isTagToken } from '../util'
import { SafeString } from '../util/safe-string'

export default class extends Tag {
  private tokens: TopLevelToken[] = []
  constructor (tagToken: TagToken, remainTokens: TopLevelToken[], liquid: Liquid) {
    super(tagToken, remainTokens, liquid)
    while (remainTokens.length) {
      const token = remainTokens.shift()!
      if (isTagToken(token) && token.name === 'endraw') return
      this.tokens.push(token)
    }
    throw new Error(`tag ${tagToken.getText()} not closed`)
  }
  render () {
    const str = this.tokens.map((token: TopLevelToken) => token.getText()).join('')
    // raw contents are template literals, mark them safe when `outputEscape`
    // is enabled so they won't be escaped again when captured
    return this.liquid.options.outputEscape && str !== '' ? new SafeString(str) : str
  }
}

import { concatSafeString, isSafeString, stringify, toValue } from '../util'
import { Emitter } from './emitter'

export class KeepingTypeEmitter implements Emitter {
  public buffer: any = '';

  public write (html: any) {
    if (isSafeString(html)) {
      // keep the buffer a SafeString if everything written so far is safe
      this.buffer = this.buffer === '' ? html : concatSafeString(this.buffer, html)
      return
    }
    html = toValue(html)
    // This will only preserve the type if the value is isolated.
    // I.E:
    // {{ my-port }} -> 42
    // {{ my-host }}:{{ my-port }} -> 'host:42'
    if (typeof html !== 'string' && this.buffer === '') {
      this.buffer = html
    } else {
      this.buffer = stringify(this.buffer) + stringify(html)
    }
  }
}

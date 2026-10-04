import { concatSafeString, isSafeString, stringify } from '../util'
import { Emitter } from './emitter'

export class SimpleEmitter implements Emitter {
  public buffer: any = '';

  public write (html: any) {
    if (isSafeString(html)) {
      // keep the buffer a SafeString if everything written so far is safe
      this.buffer = this.buffer === '' ? html : concatSafeString(this.buffer, html)
    } else {
      this.buffer = stringify(this.buffer) + stringify(html)
    }
  }
}

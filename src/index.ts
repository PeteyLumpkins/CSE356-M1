// ... add imports and fill in the code
import * as Y from 'yjs'

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  // ...
  ydoc: any
  ytext: any

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    // ...
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('quill');
    console.log(cb);

    ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
  }

  update(update: string) {
    // ...
    this.ytext.toDelta()
    console.log(update);

  }

  insert(index: number, content: string, format: CRDTFormat) {
    // ...
    if(format){
      console.log("format:", format.toString());
    }
      this.ytext.insert(index, content, { bold: true });

  }

  delete(index: number, length: number) {
    // ...
    // console.log(i ndex, length);

    this.ytext.delete(index, length);

  }

  toHTML() {
    let html = this.ytext.toString();
    // ...
    // html = "adsa";
    return html;
  }
};
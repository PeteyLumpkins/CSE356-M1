import * as Y from 'yjs';

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
  ydoc: Y.Doc;
  ytext: Y.Text; 
  cb: any;

  constructor(cb: (update: string, isLocal: Boolean) => void) {
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('quill');
    this.cb = cb;
    ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
  }

  update(update: string) {
    const event = JSON.parse(update);
    if (event.event === "sync"){
      this.ytext.delete(0, this.ytext.length);  // clear yjs text
    }
    this.ytext.applyDelta(event.data); 
  }

  insert(index: number, content: string, format: CRDTFormat) {
    this.ytext.insert(index, content, format);
  }

  delete(index: number, length: number) {
    this.ytext.delete(index, length);
  }

  toHTML() {
    let html = '';
    for (let op of this.ytext.toDelta()) {
      let text = op.insert;
      let attr = op.attributes;
      if (attr ? attr.bold : false) {
          text = "<strong>" + text + "</strong>";
      }
      if (attr ? attr.italic : false) {
        text = "<em>" + text + "</em>";
      }
      if (attr ? attr.underline : false) {
        text = "<u>" + text + "</u>";
      }
      html += text;
  }
    return html;
  }
};

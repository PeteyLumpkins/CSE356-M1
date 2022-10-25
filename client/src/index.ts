import * as Y from 'yjs'

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
};

exports.CRDT = class {
    ydoc: any
    ytext: any
    cb: Function

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText('quill');
        this.cb = cb;

        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        // ...
        this.ytext.toDelta()
        console.log(update);

    }

    insert(index: number, content: string, format: CRDTFormat) {
        console.log(format);
        this.ytext.insert(index, content, { bold: true });

    }

    delete(index: number, length: number) {
        this.ytext.delete(index, length);

    }

    toHTML() {
        let html = this.ytext.toString();
        return html;
    }
};
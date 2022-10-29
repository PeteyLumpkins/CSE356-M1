import * as Y from 'yjs';

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
};

exports.CRDT = class {
    cb: any;
    ydoc: Y.Doc;
    ytext: Y.Text;

    docId: any;
    clientId: any;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText('quill');
        this.docId = undefined;
        this.clientId = undefined;

        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        let event = JSON.parse(update);
        if (event.event === "sync") {
            this.clientId = event.clientId;
            this.ytext.delete(0, this.ytext.length);  // clear yjs text
        }
        this.ytext.applyDelta(event.data.delta);
        this.cb(JSON.stringify({clientId: this.clientId, delta: this.ytext.toDelta()}), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format);
        this.cb(JSON.stringify({clientId: this.clientId, delta: this.ytext.toDelta()}), true);
    }

    delete(index: number, length: number) {
        this.ytext.delete(index, length);
        this.cb(JSON.stringify({clientId: this.clientId, delta: this.ytext.toDelta()}), true);
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
        return "<p>" + html + "</p>";
    }
};








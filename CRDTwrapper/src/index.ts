import * as Y from 'yjs';
// var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
};

exports.CRDT = class {
    cb: any;
    ydoc: Y.Doc;
    ytext: Y.Text;
    id: number;
    flag: boolean;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText("text");
        this.id = -1;
        this.flag = false;

        this.ydoc.on("update", (update: Uint8Array, origin: any) => {
            this.cb(JSON.stringify({update: Array.from(update), clientId: origin}), this.flag);
        })

        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        let data = JSON.parse(update);
        if (data.sync) {
            this.id = data.clientId;
        }
        this.flag = false;
        Y.applyUpdate(this.ydoc, Uint8Array.from(data.update), data.clientId);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.flag = true;
        this.ytext.insert(index, content, format);
    }

    delete(index: number, length: number) {
        this.flag = true;
        this.ytext.delete(index, length);
    }

    toHTML() {
        // let converter = new QuillDeltaToHtmlConverter(this.ytext.toDelta(), )
        let html = '';

        for (let op of this.ytext.toDelta()) {
            let text = op.insert;
            let attr = op.attributes;
            if (attr ? attr.underline : false) {
                text = "<u>" + text + "</u>";
            }
            if (attr ? attr.italic : false) {
                text = "<em>" + text + "</em>";
            }
            if (attr ? attr.bold : false) {
                text = "<strong>" + text + "</strong>";
            }
            html += text;
        }
        return "<p>" + html + "</p>";
    }
};









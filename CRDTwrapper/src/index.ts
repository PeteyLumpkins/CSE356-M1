import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64'

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

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText("text");
        this.id = -1;

        this.ydoc.on("update", (update: Uint8Array, origin: any) => {
            this.cb(JSON.stringify({update: fromUint8Array(update), clientId: this.id}), origin);
        })

        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        let data = JSON.parse(update);
        if (data.sync) {
            this.id = data.clientId;
        }
        Y.applyUpdate(this.ydoc, toUint8Array(data.update), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.ydoc.transact(() => {
            this.ytext.insert(index, content, format);
        }, false)
    }

    delete(index: number, length: number) {
        this.ydoc.transact(() => {
            this.ytext.delete(index, length);
        }, false);
    }

    toHTML() {
        // let delta = this.ytext.toDelta();
        // console.log(delta)
        // let converter = new QuillDeltaToHtmlConverter(delta, {});
        // let html = converter.convert();
        // console.log(html);
        // return html;
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









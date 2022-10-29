import * as Y from 'yjs';
import Quill from 'quill';
import { QuillBinding } from 'y-quill'

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
};

exports.CRDT = class {
    ydoc: Y.Doc;
    ytext: Y.Text;

    editorBody: any;
    editor: Quill;
    binding: QuillBinding;

    docId: string = "";
    clientId: number = -1;
    block: boolean = false;

    cb: any;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText('quill');

        this.editorBody = document.createElement('div')
        this.editorBody.setAttribute('id', 'editor')
        document.body.insertBefore(this.editorBody, null)

        this.editor = new Quill(this.editorBody, {
            modules: {
                cursors: true,
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    ['image', 'code-block']
                ],
                history: {
                    userOnly: true
                }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow' // or 'bubble'
        })
        this.binding = new QuillBinding(this.ytext, this.editor);

        this.cb = cb;
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));

    }

    update(update: string) {
        let event = JSON.parse(update);
        if (event.event === "sync") {
            this.clientId = event.data.clientId;
            this.block = true;
            this.ytext.delete(0, this.ytext.length);  
            this.ytext.applyDelta(event.data.delta); 
            this.block = false;
        } else if (event.event === "update") {
            this.clientId = event.data.clientId;
            this.block = true;  
            this.ytext.applyDelta(event.data.delta); 
            this.block = false;
        }
        this.cb(JSON.stringify({clientId: this.clientId, delta: this.ytext.toDelta()}), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.block = true;
        this.ytext.insert(index, content, format);
        this.block = false;
        this.cb(JSON.stringify({delta: this.ytext.toDelta(), clientId: this.clientId}), true);
    }

    delete(index: number, length: number) {
        this.block = true;
        this.ytext.delete(index, length);
        this.block = false;
        this.cb(JSON.stringify({delta: this.ytext.toDelta(), clientId: this.clientId}), true);
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







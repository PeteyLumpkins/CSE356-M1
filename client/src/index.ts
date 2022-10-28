import * as Y from 'yjs'
// import Quill from 'quill'

class CRDTFormat {
    public bold?: Boolean = false;
    public italic?: Boolean = false;
    public underline?: Boolean = false;
};

exports.CRDT = class {
    ydoc: Y.Doc
    ytext: Y.Text
    cb: Function
    // editor: Quill;

    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText('quill');
        this.cb = cb;

        // let editorContainer = document.createElement('div')
        // editorContainer.setAttribute('id', 'editor')
        // document.body.insertBefore(editorContainer, null)

        // this.editor = new Quill(editorContainer, {
        //     modules: {
        //     cursors: true,
        //     toolbar: [
        //         [{ header: [1, 2, false] }],
        //         ['bold', 'italic', 'underline'],
        //         ['image', 'code-block']
        //     ],
        //     history: {
        //         userOnly: true
        //     }
        //     },
        //     placeholder: 'Start collaborating...',
        //     theme: 'snow' // or 'bubble'
        // });
        

        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
    }

    update(update: string) {
        this.ytext = new Y.Text(update);
        console.log(this.ytext.toString());
        this.cb(this.ytext.toString(), false);
    }

    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format ? { bold: format.bold, italic: format.italic, underline: format.underline } : format);
        console.log(this.ytext.toString());
        this.cb(this.ytext.toString(), true);
    }

    delete(index: number, length: number) {
        this.ytext.delete(index, length);
        console.log(this.ytext.toString());
        this.cb(this.ytext.toString(), true);
    }

    toHTML() {
        let html = "";
        console.log(this.ytext.toDelta());
        for (let op of this.ytext.toDelta()) {
            let text = op.insert;
            let attr = op.attributes;
            if (attr ? attr.bold : false) {
                text = "<b>" + text + "</b>";
            }
            html += text;
        }
        return html;
    }
};
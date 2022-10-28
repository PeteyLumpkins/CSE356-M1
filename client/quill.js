

/* eslint-env browser */

import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'

Quill.register('modules/cursors', QuillCursors)

window.addEventListener('load', () => {
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('quill')

    const editorContainer = document.createElement('div')
    editorContainer.setAttribute('id', 'editor')
    document.body.insertBefore(editorContainer, null)

    const editor = new Quill(editorContainer, {
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

    const binding = new QuillBinding(ytext, editor)

    // ---------------------------------------- ADDED CODE
    let eventStream = undefined;
    let docID = undefined;
    let blockEvents = false;

    const setID = (id) => {
        docID = id;
        if (id !== undefined) {
            document.getElementById("id").innerText = "Document ID: " + id;
        } else {
            document.getElementById("id").innerText = "Document ID: Undefined";
        }
    }

    // This code is incomplete...
    // probably need to figure out the yjs logic
    ytext.observe(event => {
        if (!blockEvents) {
            console.log("[OP] WRITING")
            fetch("http://localhost:3000/api/op/" + docID, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: docID,
                    data: event.changes.delta
                })
            })
        } else {
            console.log('POST FAIL');
            console.log("id: " + docID);
            console.log("blockEvents: " + blockEvents);
            console.log('delta:', event.changes.delta);
        }
    })

    // create web-event connection
    const getDocument = () => {
        let insertid = document.getElementById("insertid").value;
        if (insertid !== undefined) {
            if (eventStream) {
                console.log("[CONNECT] DISCONNECTING");
                eventStream.close();
                setID(undefined)
            }
            setID(insertid)
            // console.log("http://localhost:3000/api/connect/" + docID);
            eventStream = new EventSource("http://localhost:3000/api/connect/" + docID);
            eventStream.addEventListener('sync', event => {
                console.log("[CONNECT] SYNCING");
                blockEvents = true;
                const eventData = JSON.parse(event.data);
                ytext.delete(0, ytext.length);  // clear yjs text
                ytext.applyDelta(eventData); // apply array of text delta to view
                blockEvents = false;
            });
            eventStream.addEventListener('update', event => {
                console.log("[CONNECT] UPDATING");
                blockEvents = true;
                const eventData = JSON.parse(event.data);
                ytext.applyDelta(eventData); // apply ONE text delta to view
                blockEvents = false;
            });
        }
    }

    // The keyword "globalThis" allows variables to be "global"
    // JS in quill.html calls these variables by: <variable>
    globalThis.yjs = { ydoc, ytext, binding, Y }
    globalThis.doc = { getDocument }
})

/* eslint-env browser */

import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'

Quill.register('modules/cursors', QuillCursors)

window.addEventListener('load', () => {
    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('text')

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
    let clientId = undefined;
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
    ydoc.on('update', (update, origin, doc, tr) => {
        console.log(`Update ${update}`);
        console.log(`Origin ${origin}`);
        console.log(`Ydoc: ${doc}`);
        fetch("http://localhost:3000/api/op/" + docID, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({clientId: clientId, docId: docID, update: Array.from(update)})
        });
    });

    // create web-event connection
    const getDocument = () => {
        let insertid = document.getElementById("insertid").value;
        if (insertid === undefined) {
            return;
        }
        setID(insertid)

        eventStream = new EventSource("http://localhost:3000/api/connect/" + docID);
        eventStream.addEventListener('sync', syncHandler);
        eventStream.addEventListener('update', updateHandler);
    }

    /**
     * Handles a sync from the event stream
     * 
     *  data = {
     *      delta: Delta
     *      clientId: number
     *  }
     */
    const syncHandler = (event) => {
        console.log("Sync event caught!");
        let eventData = JSON.parse(event.data);
        clientId = eventData.clientId;
        console.log(`Client: ${clientId} Update: ${eventData.update}`);
        Y.applyUpdate(ydoc, Uint8Array.from(eventData.update), clientId); 
    }

    /**
     * Handles an update from the event stream
     * 
     *  data = {
     *      delta: Delta
     *  }
     */
    const updateHandler = (event) => {
        console.log("Got an update event!");
        let data = JSON.parse(event.data);
        // console.log(`Data: ${eventData}`);
        Y.applyUpdate(ydoc, Uint8Array.from(data.update), data.clientId)
    }

    // The keyword "globalThis" allows variables to be "global"
    // JS in quill.html calls these variables by: <variable>
    globalThis.yjs = { ydoc, ytext, binding, Y }
    globalThis.doc = { getDocument }
})
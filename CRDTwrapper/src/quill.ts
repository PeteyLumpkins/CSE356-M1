import * as Y from 'yjs';
import Quill from 'quill';
import { QuillBinding } from 'y-quill'

const ydoc = new Y.Doc();
const ytext = ydoc.getText('quill');
ytext.observe(event => {
    console.log("Op writing!");
    if (blockEvents || docID === undefined || clientId === undefined) {
        console.log('Error while trying to update!');
        return;
    }

    fetch("http://194.113.73.66/api/op/" + docID, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: clientId,
            docId: docID,
            delta: event.changes.delta
        })
    });

    console.log("Op wrote successfully!");
});

let eventStream: any = undefined;
let docID: any = undefined;
let clientId: any = undefined;
let blockEvents: boolean = false;

const setID = (id: any) => {
    docID = id;
    if (id !== undefined) {
        let html = document.getElementById("id");
        if (html !== null) {
            html.innerText = "Document ID: " + id;
        }
    } else {
        let html = document.getElementById("id");
        if (html !== null) {
            html.innerText = "Document ID: Undefined";
        }
    }
}

const updateHandler = (event: any) => {
    console.log("Got an update event!");
    let eventData = JSON.parse(event.data);
    console.log(`Data: ${eventData}`);
    let delta = eventData.delta
    // Apply the update delta
    blockEvents = true;
    ytext.applyDelta(delta);
    blockEvents = false;
}

const syncHandler = (event: any) => {
    console.log("Sync event caught!");
    let eventData = JSON.parse(event.data);
    console.log(`Data: ${eventData}`);

    clientId = eventData.clientId;

    // Clear the doc and apply the delta
    blockEvents = true;
    ytext.delete(0, ytext.length);
    ytext.applyDelta(eventData.delta);
    blockEvents = false;
}

const getDocument = () => {
    let html = document.getElementById("insertid")
    let insertId = html !== null ? html.nodeValue : undefined
    if (insertId === undefined) {
        return;
    }
    setID(insertId)

    eventStream = new EventSource("http://194.113.73.66/api/connect/" + docID);
    eventStream.addEventListener('sync', syncHandler);
    eventStream.addEventListener('update', updateHandler);
}

declare global {
    var bind: any;
    var doc: any
}

exports.getDocument = getDocument

window.addEventListener('load', () => {
    const editorContainer = document.getElementById('editor');
    if (editorContainer === null) {
        return;
    }

    const editor = new Quill(editorContainer, {
        modules: {
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
    });

    const binding = new QuillBinding(ytext, editor);
    globalThis.bind = { binding, }
});
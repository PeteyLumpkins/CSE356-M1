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

    // console.log("Op wrote successfully!");
});

let eventStream = undefined;
let docID = undefined;
let clientId = undefined;
let blockEvents = false;

const setID = (id) => {
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

const syncHandler = (event) => {
    console.log("Sync event caught!");
    let eventData = JSON.parse(event.data);
    console.log(eventData);

    clientId = eventData.clientId;

    // Clear the doc and apply the delta
    blockEvents = true;
    ytext.delete(0, ytext.length);
    ytext.applyDelta(eventData.delta);
    blockEvents = false;
}

const updateHandler = (event) => {
    console.log("Got an update event!");
    let eventData = JSON.parse(event.data);
    console.log(eventData);
    let delta = eventData.delta
    // Apply the update delta
    blockEvents = true;
    ytext.applyDelta(delta);
    blockEvents = false;
}

export const getDocument = () => {
    let insertId = document.getElementById("insertid").value;
    if (insertId === undefined) {
        return;
    }
    setID(insertId)

    eventStream = new EventSource("http://194.113.73.66/api/connect/" + docID);
    eventStream.addEventListener('sync', syncHandler);
    eventStream.addEventListener('update', updateHandler);
}
exports.getDocument = getDocument

window.addEventListener('load', () => {
    const editorContainer = document.getElementById('editor');
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
    globalThis.bind = { binding}
});
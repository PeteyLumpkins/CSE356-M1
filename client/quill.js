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
  // This code is incomplete...
  // probably need to figure out the yjs logic
  let eventMutex = false;
  let docID = "";
  ytext.observe(event => {

    console.log("id: " + docID);
    console.log('delta:', event.changes.delta);
    
    if (docID != "" && eventMutex != true) {
      console.log("[OP] WRITING")
      fetch("http://localhost:3000/api/op/" + docID, { 
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: docID,
          data: event.changes.delta
        })
      })
      console.log('POST delta');
    } 
  })

  const setDocID = (id) => {
    docID = id;
  }

  const setMutex = (state) => {
    eventMutex = state;
  }

  // @ts-ignore
  globalThis.yjs = { ydoc, ytext, binding, Y }
  globalThis.doc = { setDocID, setMutex }
  // The keyword "globalThis" allows variables to be "global"
  // JS in quill.html calls these variables by: yjs.<variable>
})

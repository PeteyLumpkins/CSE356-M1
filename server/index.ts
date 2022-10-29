import express, { Request, Response } from 'express';
import path from 'path';
import { DocumentSet, Doc, Client } from "./DocumentSet";
import * as Y from 'yjs'

const app = express();
var cors = require('cors')

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/", express.static(path.join(__dirname, "public")));

const PORT = '3000';

let documents = new DocumentSet();



app.get("/api/connect/:id", (req: Request, res: Response) => {
    console.log("[CONNECT]");
    if (!req || !req.params || !req.params.id) {
        res.status(400).json({message: "Bad Request."});
        return;
    }

    // Set server sent event headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    // Use document id to get document from the set of existing docs if it exists
    let docId: string = req.params.id;
    console.log("docId: " + docId);
    if (!documents.hasDocument(docId)) {
        documents.createDocument(docId);
    } 
    const doc: Y.Doc | null = documents.getDocument(docId);
    if (doc === null) {
        res.status(500).json({message: `Error creating document with id: ${docId}`});
        return;
    }

    // TEST WRITE INTO {ID: DOCUMENT} AND BROADCAST
    // documents.updateDocument(docId, [ { insert: docId} ]);
    // console.log(ytext.toDelta());
    // COMMENT THIS AFTER POST IS SET


    // Subscribe client to document - when the doc changes, the client gets notified
    let clientId = documents.subscribe(docId, res);
    // Send server sent event: sends yjs.text delta operation of document to client
    res.write(`event: sync\ndata: ` + JSON.stringify({
        clientId: clientId,
        delta: doc.getText(docId).toDelta()
    }) + `\n\n`);
    
    // If the client closes the connection - unsubscribe the client from the document
    req.on('close', () => {
        console.log(`${clientId} Connection closed`);
        documents.unsubscribe(docId, clientId);
    });
})

/**
 * Route for applying updates to the doc. Expects document content in 'data' field of body.
 */
app.post("/api/op/:id", (req: Request, res: Response) => {
    console.log("[OP]");
    if (!req || !req.body || !req.params) { 
        res.status(400).json({message: "Bad Request"}); 
        return; 
    } if (!req.params.id) { 
        res.status(400).json({message: "No 'id' param found"}) 
        return; 
    } if (!req.body.delta) { 
        res.status(400).json({message: "Missing update delta"});
        return;
    } if (req.body.clientId === undefined) {
        res.status(400).json({message: "Missing clientId"});
        return;
    }

    // Get id and updated data
    let docId: string = req.params.id;
    let data = req.body.delta; // Holds ONE yjs.text delta operation
    // console.log("Operation: " + data);
    console.log(data);

    // If no document with the id - return 404 not found
    if (!documents.hasDocument(docId)) {
        res.status(404).json({message: `No doc found with id: ${docId}`});
        return;
    }

    // Update the document - this updates all clients connected to the document
    documents.updateDocument(req.body.clientId, docId, data);
    res.status(200).json({message: "Success"});
})

app.listen(PORT, () => {
    console.log(`Facts Events service listening at http://localhost:${PORT}`)
});




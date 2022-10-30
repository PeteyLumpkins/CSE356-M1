import express, { Request, Response } from 'express';
import path from 'path';
import { DocumentSet } from "./DocumentSet";
import * as Y from 'yjs'
import { fromUint8Array, toUint8Array } from 'js-base64'

const app = express();
var cors = require('cors')

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/library", express.static(path.join(__dirname, "library")));
app.use("/", express.static(path.join(__dirname, "public")));

const PORT = '3000';

let documents = new DocumentSet();

app.get('/api/status', (req: Request, res: Response) => {
    let docs = []
    for (let docId of documents._docs.keys()) {
        let doc = documents.getDocument(docId);
        if (!doc) continue;

        let clients = documents._clients.get(docId);
        if (!clients) continue;

        docs.push({
            docId: docId,
            clients: clients.map(c => c.id),
            text: doc.getText("text").toJSON()
        })
    }
    res.status(200).json({docs: docs});
})

app.get("/api/connect/:id", (req: Request, res: Response) => {
    console.log("[CONNECT]");
    if (!req || !req.params || !req.params.id) {
        res.status(400).json({ message: "Bad Request." });
        return;
    }

    // Set server sent event headers
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'X-CSE356': "6306bd7b2988c22186b2719c"
    };
    res.writeHead(200, headers);

    // Use document id to get document from the set of existing docs if it exists
    let docId: string = req.params.id;
    console.log("docId: " + docId);
    if (!documents.hasDocument(docId)) {
        documents.createDocument(docId);
    }
    let doc: Y.Doc | null = documents.getDocument(docId);
    if (doc === null) {
        res.status(500).json({ message: `Error creating document with id: ${docId}` });
        return;
    }


    // Subscribe client to document - when the doc changes, the client gets notified
    let clientId = documents.subscribe(docId, res);
    // Send server sent event: sends yjs.text delta operation of document to client
    res.write(`event: sync\ndata: ` + JSON.stringify({
        sync: true,
        clientId: clientId,
        update: fromUint8Array(Y.encodeStateAsUpdate(doc))
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
        return res.status(400).json({ message: "Bad Request" });
    } if (!req.params.id) {
        return res.status(400).json({ message: "No 'id' param found" })
    } if (!req.body.update) {
        return res.status(400).json({ message: "Missing update delta" });
    } if (req.body.clientId === undefined) {
        return res.status(400).json({ message: "Missing clientId" });
    }

    // If no document with the id - return 404 not found
    if (!documents.hasDocument(req.params.id)) {
        res.status(404).json({ message: `No doc found with id: ${req.params.id}` });
        return;
    }

    console.log(`ClientId: ${req.body.clientId}`);
    console.log(`DocId: ${req.body.docId}`);
    console.log(`Update: ${req.body.update}`);

    // Update the document - this updates all clients connected to the document
    documents.updateDocument(req.body.clientId, req.params.id, toUint8Array(req.body.update));
    res.status(200).json({ message: "Success" });
})

app.listen(PORT, () => {
    console.log(`Facts Events service listening at http://localhost:${PORT}`)
});




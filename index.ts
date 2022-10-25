import express, { Request, Response } from 'express';
import path from 'path';
import { DocumentSet, Doc, Client } from "./DocumentSet";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/", express.static(path.join(__dirname, "public")));

const PORT = '3000';

let documents = new DocumentSet();

app.get('/api/status', (req: Request, res: Response) => {
    let str = "";
    for (let docId of documents._docs.keys()) {
        str += docId + ": ";
        let clients = documents._clients.get(docId);
        if (!clients) continue;
        for (let client of clients) {
            str += client.id;
            str += " -> "
        }
        str += "\n";
    }
    res.status(200).json({clients: str});
})

app.get("/api/connect/:id", (req: Request, res: Response) => {
    if (!req || !req.params || !req.params.id) {
        res.status(400).json({message: "Bad Request."});
        return;
    }
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    // Get the document id and document in the set of existing docs if it exists
    let docId = req.params.id;

    if (!documents.hasDocument(docId)) {
        documents.createDocument(docId);
    } 

    let doc = documents.getDocument(docId);
    if (doc === null) {
        res.status(500).json({message: `Error creating document with id: ${docId}`});
        return;
    }
    res.write(`data: ${JSON.stringify(doc.text)}\n\n`);
    
    // Subscribe client to document - when the doc changes, the client gets notified
    let clientId = documents.subscribe(docId, res);

    documents.updateDocument(docId, doc.text + " " + clientId);

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
    if (!req || !req.body || !req.params) { 
        res.status(400).json({message: "Bad Request"}); 
        return; 
    }
    if (!req.params.id) { 
        res.status(400).json({message: "No 'id' param found"}) 
        return; 
    }
    if (!req.body.data) { 
        res.status(400).json({message: "No 'data' field in body"});
        return;
    }

    // Get id and updated data
    let id = req.params.id;
    let data = req.body.data;

    // If no document with the id - return 404 not found
    if (!documents.hasDocument(id)) {
        res.status(404).json({message: `No doc found with id: ${id}`});
        return;
    }
    // Update the document - this updates all clients connected to the document
    documents.updateDocument(id, data);
})

app.listen(PORT, () => {
    console.log(`Facts Events service listening at http://localhost:${PORT}`)
});




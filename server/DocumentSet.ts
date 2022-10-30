import { Response } from 'express';
import * as Y from 'yjs'

export class DocumentSet {

    _docs: Map<string, any>;
    _clients: Map<string, Array<Client>>

    constructor() {
        this._docs = new Map<string, Y.Doc>();
        this._clients = new Map<string, Array<Client>>();
    }

    subscribe(docId: string, client: Response): number {
        if (!this._clients.has(docId)) {
            this._clients.set(docId, new Array<Client>());
        } 

        let clients = this._clients.get(docId);
        if (clients !== undefined) {
            let c = new Client(client);
            clients.push(c);
            return c.id;
        }
        return -1;
    }

    unsubscribe(docId: string, clientId: number): void {
        let doc = this._clients.get(docId);
        if (doc !== undefined) {
            let clients = this._clients.get(docId);
            if (clients !== undefined) {
                this._clients.set(docId, clients.filter(cli => cli.id !== clientId));
            }
        }
    }

    createDocument(docId: string): boolean {
        if (this._docs.has(docId)) {
            return false;
        }
        let ydoc = new Y.Doc({guid: docId});

        ydoc.on('update', (update: Uint8Array, origin: number, doc: Y.Doc) => {
            let clients = this._clients.get(doc.guid);
            console.log(`Client array: ${clients}`);
            if (clients !== undefined) {
                clients.forEach(client => {
                    if (client.id !== origin) {
                        let data = {
                            sync: false,
                            update: Array.from(update),
                            clientId: origin
                        }
                        client.res.write(`event: update\ndata: ${JSON.stringify(data)}\n\n`);
                    }
                });
            }
        });

        this._docs.set(docId, ydoc)
        return true;
    }
    
    hasDocument(docId: string): boolean {
        return this._docs.has(docId);
    }

    getDocument(docId: string): Y.Doc | null {
        if (!this._docs.has(docId)) {
            return null;
        }
        let ydoc = this._docs.get(docId);
        return ydoc !== undefined ? ydoc : null;
    }

    updateDocument(clientId: number, docId: string, update: Uint8Array): void {
        let ydoc = this.getDocument(docId);
        if (ydoc === null) {
            return;
        }
        console.log("Applying update too ydoc, id: " + ydoc.guid);
        Y.applyUpdate(ydoc, update, clientId);
    }
}

export class Client {
    private static ID_COUNTER: number = 0;

    id: number;
    res: Response;

    constructor(res: Response) {
        this.id = Client.ID_COUNTER++;
        this.res = res;
    }

}

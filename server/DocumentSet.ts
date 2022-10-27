import { Response } from 'express';
import * as Y from 'yjs'

export class DocumentSet {

    _docs: Map<string, any>;
    _clients: Map<string, Array<Client>>

    constructor() {
        this._docs = new Map<string, any>();
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
        const ydoc = new Y.Doc();
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
        const ydoc = this._docs.get(docId);
        return ydoc !== undefined ? ydoc : null;
    }

    updateDocument(docId: string, op: any): void {
        const ydoc = this.getDocument(docId);
        if (ydoc !== null) {
            const ytext = ydoc.getText('text');
            ytext.applyDelta(op);
            let clients = this._clients.get(docId);
            if (clients !== undefined) {
                clients.forEach(client => client.res.write(`event: update\ndata: ${JSON.stringify(op)}\n\n`));
                clients.forEach(client => console.log(client.id));
            }
        }
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

export class Doc { 

    docId: string;
    text: string;

    constructor(docId: string) {
        this.docId = docId;
        this.text = "";
    }

}
import { Response } from 'express';

export class DocumentSet {

    _docs: Map<string, Doc>;
    _clients: Map<string, Array<Client>>

    constructor() {
        this._docs = new Map<string, Doc>();
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
        let doc = new Doc(docId);
        this._docs.set(docId, doc)
        return true;
    }
    // this._clients.forEach(client => client.write(`data: ${JSON.stringify(this._text)}\n\n`));
    hasDocument(docId: string): boolean {
        return this._docs.has(docId);
    }
    getDocument(id: string): Doc | null {
        if (!this._docs.has(id)) {
            return null;
        }
        let doc = this._docs.get(id);
        return doc !== undefined ? doc : null;
    }

    updateDocument(docId: string, data: string): void {
        let doc = this._docs.get(docId);
        if (doc !== undefined) {
            doc.text = data;
            let clients = this._clients.get(docId);
            if (clients !== undefined) {
                clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`))
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

    id: string;
    text: string;

    constructor(id: string) {
        this.id = id;
        this.text = "";
    }

}
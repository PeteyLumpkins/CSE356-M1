"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doc = exports.Client = exports.DocumentSet = void 0;
const Y = __importStar(require("yjs"));
class DocumentSet {
    constructor() {
        this._docs = new Map();
        this._clients = new Map();
    }
    subscribe(docId, client) {
        if (!this._clients.has(docId)) {
            this._clients.set(docId, new Array());
        }
        let clients = this._clients.get(docId);
        if (clients !== undefined) {
            let c = new Client(client);
            clients.push(c);
            return c.id;
        }
        return -1;
    }
    unsubscribe(docId, clientId) {
        let doc = this._clients.get(docId);
        if (doc !== undefined) {
            let clients = this._clients.get(docId);
            if (clients !== undefined) {
                this._clients.set(docId, clients.filter(cli => cli.id !== clientId));
            }
        }
    }
    createDocument(docId) {
        if (this._docs.has(docId)) {
            return false;
        }
        let ydoc = new Y.Doc();
        this._docs.set(docId, ydoc);
        return true;
    }
    hasDocument(docId) {
        return this._docs.has(docId);
    }
    getDocument(docId) {
        if (!this._docs.has(docId)) {
            return null;
        }
        let ydoc = this._docs.get(docId);
        return ydoc !== undefined ? ydoc : null;
    }
    updateDocument(clientId, docId, op) {
        let ydoc = this.getDocument(docId);
        if (ydoc === null) {
            return;
        }
        let ytext = ydoc.getText(docId);
        ytext.applyDelta(op);
        let clients = this._clients.get(docId);
        if (clients !== undefined) {
            clients.forEach(client => {
                if (client.id !== clientId)
                    client.res.write(`event: update\ndata: ${JSON.stringify({ delta: op })}\n\n`);
            });
            clients.forEach(client => console.log(client.id));
        }
    }
}
exports.DocumentSet = DocumentSet;
class Client {
    constructor(res) {
        this.id = Client.ID_COUNTER++;
        this.res = res;
    }
}
exports.Client = Client;
Client.ID_COUNTER = 0;
class Doc {
    constructor(docId) {
        this.docId = docId;
        this.text = "";
    }
}
exports.Doc = Doc;

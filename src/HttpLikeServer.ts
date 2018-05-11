import {
    IPC_Server,
    IPC_Client,
    HTTP_LIKE_CONSTANTS,
    HttpLikeRequest,
} from './constants';
import { EventEmitter } from 'events';
import { registerIpcRes } from './index'
export class HttpLikeServer extends EventEmitter {
    constructor(public server: IPC_Server) {
        super();
    }
    get(path: string, handle: (req: HttpLikeRequest) => void) {
        // TODO: parse params
        registerIpcRes(this.server, (msg) => {
            return msg[HTTP_LIKE_CONSTANTS.path] === path
        }, (msg) => handle({ params: {}, query: msg.query }));
    }
}
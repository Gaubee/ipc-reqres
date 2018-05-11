import {
    IPC_Client,
    HTTP_LIKE_CONSTANTS,
} from './constants';
import { EventEmitter } from 'events';
import { ipcReqAsync } from './index';
export class HttpLikeClient extends EventEmitter {
    constructor(public socket: IPC_Client) {
        super();
    }
    get(path: string, query) {
        return ipcReqAsync(this.socket, {
            [HTTP_LIKE_CONSTANTS.path]: path,
            query
        });
    }
}
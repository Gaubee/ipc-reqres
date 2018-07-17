import {
    JSONDry,
    constants,
    debug,
    IPC_Client,
    IPC_Server,
} from './constants';
export { JSONDry };

export const REQ_CB_REGISTER_WM = new WeakMap();

let req_id_acc = 0;
export function ipcReq(ipc_client: IPC_Client, header: any, data: any, cb: (err: any, res: any) => void) {
    const req_id = req_id_acc++;
    const req_cb_register: Map<number, Function> = (() => {
        let map = REQ_CB_REGISTER_WM.get(ipc_client);
        if (!map) {
            REQ_CB_REGISTER_WM.set(ipc_client, map = new Map());
            ipc_client.on("message", (msg) => {
                if (msg.icmd === constants.RES) {
                    const { req_id, data } = msg;
                    const cb = req_cb_register.get(req_id);
                    if (!cb) {
                        throw new Error(`req id:${req_id} no found,should no happen.`)
                    }
                    const { error, result } = JSONDry.parse(data);
                    cb(error, result);
                    req_cb_register.delete(req_id);
                }
            });
        }
        return map;
    })();

    ipc_client.send({
        icmd: constants.REQ,
        req_id,
        pkg: JSONDry.stringify({
            header,
            data
        })
    });
    debug("request %o", req_id);
    req_cb_register.set(req_id, cb);
}
export function ipcReqAsync<T=any>(ipc_client: IPC_Client, header: any, data?: any) {
    return new Promise<T>((resolve, reject) => {
        ipcReq(ipc_client, header, data, (err, res) => {
            err ? reject(err) : resolve(res)
        });
    })
}

const IPC_RES_SYMBOL = Symbol("ipc-res");
class IpcResConfig {
    fast_matchs = new Map<string, any>();
    regexp_matchs = new Map<RegExp, any>();
    custom_matchs = new Set();
    async handle(socket, msg) {
        if (!(msg.icmd === constants.REQ)) {
            return;
        }
        const { header: msg_header, data: msg_data } = JSONDry.parse(msg.pkg);

        let res_handler;
        let req_query;
        if (typeof msg_header === 'string') {
            const query = {
                path: msg_header,
                params: {} as any
            }
            res_handler = this.fast_matchs.get(query.path);
            if (!res_handler) {
                for (let [regexp_match, handle] of this.regexp_matchs.entries()) {
                    const match_info = regexp_match.exec(query.path)
                    if (match_info) {
                        res_handler = handle;
                        query.params = Object.assign(match_info.slice(), match_info['groups']);
                        break;
                    }
                }
            }
            req_query = query;
        }
        if (!res_handler) {
            const ite = this.custom_matchs.values();
            for (let [custom_match, handle] of this.custom_matchs.values()) {
                if (await custom_match(msg_header)) {
                    req_query = msg_header;
                    res_handler = handle;
                    break;
                }
            }
        }
        const res_cb = (error?, result?) => {
            socket.send({
                icmd: constants.RES,
                req_id: msg.req_id,
                data: JSONDry.stringify({ error, result })
            });
        }
        if (!res_handler) {
            res_cb(new Error("Response Handle No Found."))
            return;
        }

        try {
            res_cb(null, await res_handler(req_query, msg_data))
        } catch (err) {
            res_cb(err);
        }
    }
    constructor() {
        this.handle = this.handle.bind(this);
    }
}
export function registerIpcRes(ipc_server: IPC_Server, match: ((header) => boolean) | string | RegExp, handle: (header, body) => any) {
    let ipcResConfig: IpcResConfig = ipc_server[IPC_RES_SYMBOL];
    if (!ipcResConfig) {
        ipcResConfig = new IpcResConfig();
        ipc_server[IPC_RES_SYMBOL] = ipcResConfig;
        ipc_server.on("message", ipcResConfig.handle);
    }
    if (typeof match === "string") {
        ipcResConfig.fast_matchs.set(match, handle);
    } else if (typeof match === "function") {
        ipcResConfig.custom_matchs.add([match, handle]);
    } else if (match instanceof RegExp) {

    }
}
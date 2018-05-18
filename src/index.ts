import {
    JSONDry,
    constants,
    debug,
    IPC_Client,
    IPC_Server,
} from './constants';

export const REQ_CB_REGISTER_WM = new WeakMap();

let req_id_acc = 0;
export function ipcReq(ipc_client: IPC_Client, data: any, cb: (err: any, res: any) => void) {
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
                    const { error, result } = JSON.parse(data);
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
        data
    });
    debug("request %o", req_id);
    req_cb_register.set(req_id, cb);
}
export function ipcReqAsync<T=any>(ipc_client: IPC_Client, data: any) {
    return new Promise<T>((resolve, reject) => {
        ipcReq(ipc_client, data, (err, res) => {
            err ? reject(err) : resolve(res)
        });
    })
}
export function registerIpcRes(ipc_server: IPC_Server, match: (msg) => boolean, handle: (msg) => any) {
    ipc_server.on("message", (socket, msg) => {
        if (!(msg.icmd === constants.REQ && match(msg.data))) {
            return;
        }
        debug(msg);
        const res_cb = (error?, result?) => {
            socket.send({
                icmd: constants.RES,
                req_id: msg.req_id,
                data: JSONDry.stringify({ error, result })
            });
        }
        try {
            Promise.resolve(handle(msg.data))
                .then(result => res_cb(null, result), res_cb);
        } catch (err) {
            res_cb(err);
        }
    });
}
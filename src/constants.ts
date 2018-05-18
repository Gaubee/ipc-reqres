const constants_prefix = "IPC_REQS_";
export const constants = {
    REQ: constants_prefix + "REQ",
    RES: constants_prefix + "RES",
}
export const HTTP_LIKE_CONSTANTS = {
    path: ":path"
}
export type HttpLikeRequest = {
    query: any,
    params: any,
}

export const ErrorConstructorList = Object.getOwnPropertyNames(global).filter(name => name.endsWith("Error")).map(errname => global[errname]);


import { JSONDryFactory } from 'json-dry-factory';
export const JSONDry = new JSONDryFactory('cluster-require');

JSONDry.registerClass(Error, {
    toDry(ins) {
        return {
            // 自定义IPC拓展信息
            extend_first_line: this.getDryExtendFirstLine(),
            message: this.message,
            stack: this.stack
        }
    },
    unDry(value, Constructor) {
        const err = Object.create(Constructor.prototype);
        Object.defineProperty(err, 'message', { value: value.message });
        let extend_first_line = String(value.extend_first_line || "").trim();
        let error_stack = value.stack;
        if (extend_first_line) {
            extend_first_line = `\n    ${extend_first_line}\n`;
            error_stack = error_stack.replace(/\n/, value.extend_first_line);
        }
        Object.defineProperty(err, 'stack', { value: error_stack });
        return err;
    }
});

export const debug = require("debug")("ipc-reqres");


export interface IPC_Client extends NodeJS.EventEmitter {
    send(msg, ...args): any
    on(event: "message", listener: (msg) => any): this
    addListener(event: "message", listener: (msg) => any): this
}

export interface IPC_Server extends NodeJS.EventEmitter {
    on(event: "message", listener: (socket: IPC_Client, msg) => any): this
    addListener(event: "message", listener: (socket: IPC_Client, msg) => any): this
}
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

// TODO: 实现一个自定义的json-dry-Factory，而不是所有程序公用一个parse。这样不同的包不会混淆
import * as Dry from 'json-dry';
ErrorConstructorList.forEach(ErrorConstructor => {
    if (ErrorConstructor.prototype.toDry) {
        return;
    }
    Dry.registerClass(ErrorConstructor);

    Object.defineProperty(ErrorConstructor.prototype, "toDry", {
        value: function toDry() {
            return {
                value: {
                    // 自定义IPC拓展信息
                    extend_first_line: this.getDryExtendFirstLine(),
                    message: this.message,
                    stack: this.stack
                }
            }
        },
        writable: true
    });
    Object.defineProperty(ErrorConstructor.prototype, "getDryExtendFirstLine", {
        value: () => { },
        writable: true
    });
    Object.defineProperty(ErrorConstructor, "unDry", {
        value: function unDry(value) {
            const err = new ErrorConstructor(value.message);
            err.stack = value.stack;
            // 在第一行后面插入拓展信息
            if (value.extend_first_line) {
                err.stack = err.stack.replace(/\n/, value.extend_first_line);
            }
            return err;
        },
        writable: true
    });
});
export const JsonDry = Dry;
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
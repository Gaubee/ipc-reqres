import { IPC_Client, IPC_Server } from 'gipc';
import { registerIpcRes, ipcReqAsync, JSONDry } from '../src';

(async () => {
    const server = new IPC_Server("QAQ");
    const ipc_address = await server.listen();
    const client = new IPC_Client(ipc_address);
    {
        registerIpcRes(server, msg => msg.path === "qaq", async (msg) => {
            return 'zzz';
        });
        const data = await ipcReqAsync(client, { path: 'qaq' });
        console.log("zzz" === data, 'req data');
    }
    {
        class AAA {
            constructor(public name: string) {
            }
        }
        JSONDry.registerClass(AAA, {
            unDry(ins) {
                return new AAA(ins.name)
            }
        });
        registerIpcRes(server, "zzzzzz", async (query, body) => {
            console.log("msg", query, body)
            return body
        });
        const data = await ipcReqAsync(client, 'zzzzzz', new AAA('qaq'));
        console.log(data instanceof AAA, data, 'json dry');
    }
    console.log("√ all passed.");
})().catch((err) => {
    console.error("QQQQQ", err)
});
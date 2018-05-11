import { IPC_Client, IPC_Server } from 'gipc';
import { registerIpcRes, ipcReqAsync } from '../src';

(async () => {
    const server = new IPC_Server("QAQ");
    const ipc_address = await server.listen();
    registerIpcRes(server, (msg) => msg.path === "qaq", async (msg) => {
        return 'zzz';
    });
    const client = new IPC_Client(ipc_address);
    const data = await ipcReqAsync(client, { path: 'qaq' });
    console.log("get data", data);
})().catch(console.error);
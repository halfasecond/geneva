import { Server } from 'socket.io';
import { Connection } from 'mongoose';
import { KittyFamilyModels } from './models';
import { familyService } from './service';
import { newsQueries } from '../kittynews/queries';
import { KittyNewsModels } from '../kittynews/models';

type Head = { blocknumber: number; timestamp: number };

export default (
    io: Server,
    Models: KittyFamilyModels,
    newsModels: KittyNewsModels,
    db: Connection,
    emitter: any,
) => {
    const familyNs = io.of('/kittyfamily');
    const family = familyService(Models, db);
    const news = newsQueries(newsModels, db);
    let sockets = 0;
    let latest: Head = { blocknumber: 0, timestamp: 0 };

    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        latest = { blocknumber: Number(number), timestamp: Number(timestamp) };
        familyNs.emit('newEthBlock', latest);
    });

    familyNs.on('connection', (socket) => {
        sockets += 1;
        familyNs.emit('users connected', sockets);
        if (latest.blocknumber) socket.emit('newEthBlock', latest);

        socket.on('ckReport', async () => {
            socket.emit('ckReport', await news.latestReport());
        });
        socket.on('getMessages', async () => {
            socket.emit('messages', await family.messages());
        });
        socket.on('getAccounts', async () => {
            socket.emit('accounts', await family.accounts());
        });
        socket.on('addMessage', async (req: { message?: string; account?: string }) => {
            if (!req?.message || !req?.account) return;
            const messages = await family.addMessage(req.account, req.message);
            familyNs.emit('messages', messages);
        });

        socket.on('disconnect', () => {
            sockets = Math.max(0, sockets - 1);
            familyNs.emit('users connected', sockets);
        });
    });
};

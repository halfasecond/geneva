import { Server } from 'socket.io';
import { Connection } from 'mongoose';
import { KittyNewsModels } from './models';
import { FloorMap, newsQueries } from './queries';

type Head = { blocknumber: number; timestamp: number };

export default (io: Server, Models: KittyNewsModels, db: Connection, emitter: any) => {
    const news = io.of('/kittynews');
    const q = newsQueries(Models, db);
    let latest: Head = { blocknumber: 0, timestamp: 0 };

    const cache: {
        report?: unknown;
        transfers?: unknown;
        births?: unknown;
        floor: FloorMap;
    } = { floor: {} };

    const setHead = (head: Head) => {
        if (!head.blocknumber || head.blocknumber < latest.blocknumber) return;
        latest = head;
    };

    const seedHead = async () => {
        const col = db.db?.collection('indexed_blocks');
        if (!col) return;
        const row = await col.find({}).sort({ blockNumber: -1 }).limit(1).next();
        if (!row?.blockNumber) return;
        const timestamp = row.blockTimestamp instanceof Date
            ? Math.floor(row.blockTimestamp.getTime() / 1000)
            : Number(row.blockTimestamp) || 0;
        setHead({ blocknumber: Number(row.blockNumber), timestamp });
    };

    const emitCached = (socket: { emit: (event: string, payload: unknown) => void }) => {
        if (latest.blocknumber) socket.emit('newEthBlock', latest);
        if (cache.report) socket.emit('ckReport', cache.report);
        if (cache.transfers) socket.emit('ckTransfer', cache.transfers);
        if (cache.births) socket.emit('ckBirth', cache.births);
        if (Object.keys(cache.floor).length) socket.emit('ckFloor', cache.floor);
    };

    const setFloor = (partial: FloorMap) => {
        cache.floor = { ...cache.floor, ...partial };
        news.emit('ckFloor', cache.floor);
    };

    let warming = false;
    const warm = async () => {
        if (warming) return;
        warming = true;
        try {
            try {
                cache.report = await q.latestReport();
                news.emit('ckReport', cache.report);
            } catch (error) {
                console.error('[kittynews] report snapshot failed', error);
            }

            try {
                cache.births = await q.births();
                news.emit('ckBirth', cache.births);
            } catch (error) {
                console.error('[kittynews] births snapshot failed', error);
            }

            try {
                cache.transfers = await q.transfers();
                news.emit('ckTransfer', cache.transfers);
            } catch (error) {
                console.error('[kittynews] transfers snapshot failed', error);
                cache.transfers = [];
                news.emit('ckTransfer', cache.transfers);
            }

            try {
                setFloor(await q.mongoFloors());
            } catch (error) {
                console.error('[kittynews] mongo floors snapshot failed', error);
            }

            try {
                setFloor(await q.apiFloors());
            } catch (error) {
                console.error('[kittynews] ck api floors snapshot failed', error);
            }

            try {
                cache.report = await q.latestReport();
                news.emit('ckReport', cache.report);
            } catch (error) {
                console.error('[kittynews] report refresh failed', error);
            }
        } finally {
            warming = false;
        }
    };

    let lastFloorRefresh = 0;
    emitter.on('newEthBlock', ({ number, timestamp }: { number: number; timestamp: number }) => {
        setHead({ blocknumber: Number(number), timestamp: Number(timestamp) });
        news.emit('newEthBlock', latest);
        if (Date.now() - lastFloorRefresh < 60_000) return;
        lastFloorRefresh = Date.now();
        void q.mongoFloors()
            .then(setFloor)
            .then(() => q.apiFloors())
            .then(setFloor)
            .catch((error) => console.error('[kittynews] floor refresh failed', error));
    });

    news.on('connection', (socket) => {
        emitCached(socket);
        socket.on('ckReport', async () => {
            try { socket.emit('ckReport', cache.report ?? await q.latestReport()); }
            catch (error) { console.error('[kittynews] ckReport', error); }
        });
        socket.on('ckFloor', async () => {
            try {
                if (Object.keys(cache.floor).length) socket.emit('ckFloor', cache.floor);
                else socket.emit('ckFloor', await q.floors());
            } catch (error) { console.error('[kittynews] ckFloor', error); }
        });
        socket.on('ckTransfer', async () => {
            try { socket.emit('ckTransfer', cache.transfers ?? await q.transfers()); }
            catch (error) { console.error('[kittynews] ckTransfer', error); }
        });
        socket.on('ckBirth', async () => {
            try { socket.emit('ckBirth', cache.births ?? await q.births()); }
            catch (error) { console.error('[kittynews] ckBirth', error); }
        });
        if (!cache.report || !cache.births || !cache.transfers || !Object.keys(cache.floor).length) {
            void warm();
        }
    });

    void seedHead()
        .then(() => {
            if (latest.blocknumber) news.emit('newEthBlock', latest);
        })
        .catch((error) => console.error('[kittynews] seed eth block failed', error));
    void warm();
};

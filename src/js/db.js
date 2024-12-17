import Dexie from 'dexie';

const db = new Dexie('policeSystem');

db.version(1).stores({
    users: '++id, email',
    abordagens: '++id, data, local, *envolvidos'
});

export default db; 
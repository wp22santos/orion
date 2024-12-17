console.log('[DB] Iniciando configuração do banco de dados...');

const db = new Dexie('SistemaPolicialDB');

console.log('[DB] Definindo esquema do banco de dados...');
// Definir o esquema do banco de dados
db.version(1).stores({
    usuarios: '++id, email',
    pessoas: '++id, nome, nomeMae, rg, cpf, &[rg+cpf]',
    abordagens: '++id, pessoaId, data, localizacao',
    veiculos: '++id, abordagemId, tipo, marca, placa',
    acompanhantes: '++id, abordagemId, pessoaId'
});

// Função para criptografar dados
function encryptData(data, key) {
    console.log('[DB] Criptografando dados...');
    return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

// Função para descriptografar dados
function decryptData(encryptedData, key) {
    console.log('[DB] Descriptografando dados...');
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Inicializar o banco de dados
console.log('[DB] Tentando abrir o banco de dados...');
db.open()
    .then(() => {
        console.log('[DB] Banco de dados aberto com sucesso!');
        // Verificar se as tabelas foram criadas
        return db.tables.forEach(table => {
            console.log(`[DB] Tabela encontrada: ${table.name}`);
        });
    })
    .catch(err => {
        console.error('[DB] Erro ao abrir banco de dados:', err.stack || err);
    });

// Exportar o banco de dados
window.db = db;
console.log('[DB] Configuração do banco de dados concluída.'); 
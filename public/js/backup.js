const backupManager = {
    async exportData() {
        try {
            // Coletar todos os dados
            const dados = {
                pessoas: await db.pessoas.toArray(),
                abordagens: await db.abordagens.toArray(),
                timestamp: new Date().toISOString(),
                versao: '1.0'
            };

            // Criar blob e link para download
            const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            return false;
        }
    },

    async importData() {
        try {
            // Criar input file invisível
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            // Processar arquivo selecionado
            const processarArquivo = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const dados = JSON.parse(e.target.result);

                            // Validar estrutura do backup
                            if (!dados.pessoas || !dados.abordagens || !dados.timestamp || !dados.versao) {
                                throw new Error('Arquivo de backup inválido');
                            }

                            // Limpar dados existentes
                            await db.pessoas.clear();
                            await db.abordagens.clear();

                            // Importar pessoas primeiro
                            for (const pessoa of dados.pessoas) {
                                // Garantir que o ID seja mantido
                                await db.pessoas.put(pessoa);
                            }

                            // Importar abordagens
                            for (const abordagem of dados.abordagens) {
                                await db.abordagens.put(abordagem);
                            }

                            resolve(true);
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
                    reader.readAsText(file);
                });
            };

            return new Promise((resolve) => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) {
                        resolve(false);
                        return;
                    }

                    try {
                        await processarArquivo(file);
                        resolve(true);
                    } catch (error) {
                        console.error('Erro ao importar:', error);
                        resolve(false);
                    }
                };

                input.click();
            });
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }
};

// Gerenciador de armazenamento persistente
const storageManager = {
    async requestPersistentStorage() {
        try {
            // Verificar se o navegador suporta armazenamento persistente
            if (navigator.storage && navigator.storage.persist) {
                // Verificar se já é persistente
                const isPersisted = await navigator.storage.persisted();
                if (!isPersisted) {
                    // Solicitar permissão para armazenamento persistente
                    const persisted = await navigator.storage.persist();
                    console.log(`Armazenamento persistente ${persisted ? 'concedido' : 'negado'}`);
                    return persisted;
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao solicitar armazenamento persistente:', error);
            return false;
        }
    },

    async checkStorageQuota() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const percentageUsed = (estimate.usage / estimate.quota) * 100;
                console.log(`Armazenamento usado: ${Math.round(percentageUsed)}%`);
                console.log(`${Math.round(estimate.usage / 1024 / 1024)}MB de ${Math.round(estimate.quota / 1024 / 1024)}MB`);
                
                // Alertar se estiver usando mais de 80% do espaço
                if (percentageUsed > 80) {
                    alert('Atenção: Seu armazenamento está quase cheio. Considere fazer um backup dos dados.');
                }
            }
        } catch (error) {
            console.error('Erro ao verificar cota de armazenamento:', error);
        }
    }
};

// Menu de Backup
document.addEventListener('DOMContentLoaded', async () => {
    // Solicitar armazenamento persistente ao iniciar
    await storageManager.requestPersistentStorage();
    
    // Verificar espaço de armazenamento
    await storageManager.checkStorageQuota();

    const btnBackup = document.querySelector('#btnBackup');
    if (!btnBackup) return;

    btnBackup.addEventListener('click', () => {
        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'backup-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        // Criar menu
        const menu = document.createElement('div');
        menu.className = 'backup-menu mdl-card mdl-shadow--4dp';
        menu.style.cssText = `
            background: white;
            padding: 0;
            width: 90%;
            max-width: 400px;
            border-radius: 4px;
            position: relative;
        `;

        menu.innerHTML = `
            <div class="mdl-card__title" style="background: #3f51b5; color: white;">
                <h2 class="mdl-card__title-text">Backup e Restauração</h2>
            </div>
            <div class="mdl-card__supporting-text" style="padding: 16px;">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button id="btnExportar" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" style="width: 100%;">
                        <i class="material-icons" style="margin-right: 8px;">backup</i>
                        Exportar Dados
                    </button>
                    <button id="btnImportar" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" style="width: 100%;">
                        <i class="material-icons" style="margin-right: 8px;">restore</i>
                        Importar Dados
                    </button>
                </div>
            </div>
            <div class="mdl-card__actions mdl-card--border" style="padding: 8px; text-align: right;">
                <button id="btnFecharMenu" class="mdl-button mdl-js-button mdl-button--raised">
                    <i class="material-icons" style="margin-right: 8px;">close</i>
                    Fechar
                </button>
            </div>
        `;

        overlay.appendChild(menu);
        document.body.appendChild(overlay);

        // Função para fechar o menu
        const fecharMenu = () => {
            document.body.removeChild(overlay);
        };

        // Eventos
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) fecharMenu();
        });

        menu.querySelector('#btnFecharMenu').addEventListener('click', fecharMenu);

        menu.querySelector('#btnExportar').addEventListener('click', async () => {
            try {
                // Verificar espaço antes de exportar
                await storageManager.checkStorageQuota();

                // Coletar dados
                const dados = {
                    pessoas: await db.pessoas.toArray(),
                    abordagens: await db.abordagens.toArray(),
                    timestamp: new Date().toISOString(),
                    versao: '1.0'
                };

                // Tentar usar a File System Access API se disponível
                if ('showSaveFilePicker' in window) {
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: `backup_sistema_${new Date().toISOString().split('T')[0]}.json`,
                            types: [{
                                description: 'Arquivo JSON',
                                accept: {'application/json': ['.json']},
                            }],
                        });
                        
                        const writable = await handle.createWritable();
                        await writable.write(JSON.stringify(dados, null, 2));
                        await writable.close();
                        
                        alert('Backup exportado com sucesso!');
                        fecharMenu();
                        return;
                    } catch (error) {
                        console.log('Fallback para método alternativo de download:', error);
                    }
                }

                // Método alternativo de download se File System Access API não estiver disponível
                const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert('Backup exportado com sucesso!');
                fecharMenu();
            } catch (error) {
                console.error('Erro ao exportar:', error);
                alert('Erro ao exportar dados. Verifique o console.');
            }
        });

        menu.querySelector('#btnImportar').addEventListener('click', async () => {
            try {
                if (!confirm('ATENÇÃO: Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                    return;
                }

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';

                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    try {
                        console.log('Iniciando importação do arquivo:', file.name);
                        const texto = await file.text();
                        const dados = JSON.parse(texto);

                        // Validação mais rigorosa dos dados
                        if (!dados.pessoas || !Array.isArray(dados.pessoas)) {
                            throw new Error('Formato inválido: pessoas não encontradas ou formato incorreto');
                        }
                        if (!dados.abordagens || !Array.isArray(dados.abordagens)) {
                            throw new Error('Formato inválido: abordagens não encontradas ou formato incorreto');
                        }
                        if (!dados.timestamp || !dados.versao) {
                            throw new Error('Formato inválido: metadados ausentes');
                        }

                        console.log(`Dados validados: ${dados.pessoas.length} pessoas, ${dados.abordagens.length} abordagens`);

                        // Limpar dados atuais
                        console.log('Limpando dados existentes...');
                        await db.transaction('rw', db.pessoas, db.abordagens, async () => {
                            await db.pessoas.clear();
                            await db.abordagens.clear();

                            // Importar pessoas primeiro
                            console.log('Importando pessoas...');
                            const pessoasIds = await db.pessoas.bulkAdd(dados.pessoas, { allKeys: true });
                            console.log(`${pessoasIds.length} pessoas importadas com sucesso`);

                            // Importar abordagens
                            console.log('Importando abordagens...');
                            const abordagensIds = await db.abordagens.bulkAdd(dados.abordagens, { allKeys: true });
                            console.log(`${abordagensIds.length} abordagens importadas com sucesso`);
                        });

                        alert('Dados importados com sucesso! A página será recarregada.');
                        window.location.reload();
                    } catch (error) {
                        console.error('Erro detalhado ao importar:', error);
                        alert(`Erro ao importar dados: ${error.message}`);
                    }
                };

                input.click();
            } catch (error) {
                console.error('Erro ao iniciar importação:', error);
                alert('Erro ao iniciar processo de importação.');
            }
        });
    });
}); 
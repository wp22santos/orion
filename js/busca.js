document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const formBusca = document.querySelector('#formBusca');
    const resultadosBusca = document.querySelector('#resultadosBusca');
    const modalDetalhes = document.querySelector('#modalDetalhes');
    const btnFecharDetalhes = document.querySelector('#btnFecharDetalhes');
    const termoBusca = document.querySelector('#termoBusca');

    // Registrar o dialog polyfill se necessário
    if (!modalDetalhes.showModal) {
        dialogPolyfill.registerDialog(modalDetalhes);
    }

    // Event Listeners
    formBusca.addEventListener('submit', async (e) => {
        e.preventDefault();
        await realizarBusca();
    });

    // Busca em tempo real após 300ms de pausa na digitação
    let timeoutId;
    termoBusca.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(realizarBusca, 300);
    });

    formBusca.addEventListener('reset', () => {
        resultadosBusca.innerHTML = '';
    });

    btnFecharDetalhes.addEventListener('click', () => {
        modalDetalhes.close();
    });
});

async function realizarBusca() {
    const termo = document.querySelector('#termoBusca').value.trim().toLowerCase();
    const dataInicio = document.querySelector('#dataInicio').value;
    const dataFim = document.querySelector('#dataFim').value;

    if (!termo && !dataInicio && !dataFim) {
        document.querySelector('#resultadosBusca').innerHTML = '';
        return;
    }

    try {
        // Buscar todas as abordagens
        let abordagens = await db.abordagens.toArray();
        let pessoas = await db.pessoas.toArray();
        let veiculos = await db.veiculos.toArray();

        // Criar índice de pessoas e veículos para busca rápida
        const pessoasIndex = new Map(pessoas.map(p => [p.id, p]));
        const veiculosPorAbordagem = veiculos.reduce((acc, v) => {
            if (!acc[v.abordagemId]) acc[v.abordagemId] = [];
            acc[v.abordagemId].push(v);
            return acc;
        }, {});

        // Filtrar por data se especificado
        if (dataInicio || dataFim) {
            abordagens = abordagens.filter(abordagem => {
                const data = new Date(abordagem.data);
                if (dataInicio && new Date(dataInicio) > data) return false;
                if (dataFim && new Date(dataFim) < data) return false;
                return true;
            });
        }

        // Se houver termo de busca, filtrar por todos os campos relevantes
        if (termo) {
            abordagens = abordagens.filter(abordagem => {
                // Buscar pessoa principal
                const pessoa = pessoasIndex.get(abordagem.pessoaId);
                
                // Buscar acompanhantes
                const acompanhantes = (abordagem.acompanhantesIds || [])
                    .map(id => pessoasIndex.get(id))
                    .filter(Boolean);
                
                // Buscar veículos da abordagem
                const veiculosAbordagem = veiculosPorAbordagem[abordagem.id] || [];

                // Verificar em todos os campos possíveis
                return (
                    // Campos da pessoa principal
                    pessoa?.nome?.toLowerCase().includes(termo) ||
                    pessoa?.rg?.toLowerCase().includes(termo) ||
                    pessoa?.cpf?.toLowerCase().includes(termo) ||
                    pessoa?.nomeMae?.toLowerCase().includes(termo) ||
                    pessoa?.endereco?.toLowerCase().includes(termo) ||
                    
                    // Campos dos acompanhantes
                    acompanhantes.some(a => 
                        a?.nome?.toLowerCase().includes(termo) ||
                        a?.rg?.toLowerCase().includes(termo) ||
                        a?.cpf?.toLowerCase().includes(termo) ||
                        a?.nomeMae?.toLowerCase().includes(termo)
                    ) ||
                    
                    // Campos dos veículos
                    veiculosAbordagem.some(v => 
                        v?.placa?.toLowerCase().includes(termo) ||
                        v?.marca?.toLowerCase().includes(termo) ||
                        v?.modelo?.toLowerCase().includes(termo) ||
                        v?.tipo?.toLowerCase().includes(termo)
                    ) ||
                    
                    // Campos da abordagem
                    abordagem.localizacao?.endereco?.toLowerCase().includes(termo) ||
                    abordagem.observacoes?.toLowerCase().includes(termo)
                );
            });
        }

        // Ordenar por data mais recente
        abordagens.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Exibir resultados
        await exibirResultados(abordagens);

    } catch (error) {
        console.error('Erro na busca:', error);
        alert('Erro ao realizar busca');
    }
}

async function exibirResultados(abordagens) {
    const container = document.querySelector('#resultadosBusca');
    container.innerHTML = '';

    if (abordagens.length === 0) {
        container.innerHTML = `
            <div class="mdl-cell mdl-cell--12-col">
                <p>Nenhum resultado encontrado</p>
            </div>
        `;
        return;
    }

    for (const abordagem of abordagens) {
        const pessoa = await db.pessoas.get(abordagem.pessoaId);
        const veiculos = await db.veiculos
            .where('abordagemId')
            .equals(abordagem.id)
            .toArray();

        const acompanhantesIds = abordagem.acompanhantesIds || [];
        const acompanhantes = await Promise.all(
            acompanhantesIds.map(id => db.pessoas.get(id))
        );

        const card = criarCardResultado(abordagem, pessoa, veiculos, acompanhantes);
        container.appendChild(card);
    }

    // Atualizar os componentes MDL
    componentHandler.upgradeDom();
}

function criarCardResultado(abordagem, pessoa, veiculos, acompanhantes) {
    const div = document.createElement('div');
    div.className = 'mdl-cell mdl-cell--4-col';
    
    const data = new Date(abordagem.data).toLocaleString();
    const veiculosTexto = veiculos.map(v => `${v.tipo} - ${v.placa}`).join(', ');
    const acompanhantesTexto = acompanhantes.length > 0 
        ? `<p><strong>Acompanhantes:</strong> ${acompanhantes.map(a => a.nome).join(', ')}</p>` 
        : '';

    div.innerHTML = `
        <div class="mdl-card mdl-shadow--2dp" style="width: 100%; min-height: auto;">
            <div class="mdl-card__title">
                <h2 class="mdl-card__title-text">${pessoa.nome}</h2>
            </div>
            <div class="mdl-card__supporting-text">
                <p><strong>Data:</strong> ${data}</p>
                <p><strong>Local:</strong> ${abordagem.localizacao.endereco}</p>
                ${veiculos.length > 0 ? `<p><strong>Veículos:</strong> ${veiculosTexto}</p>` : ''}
                ${acompanhantesTexto}
                ${abordagem.observacoes ? `<p><strong>Observações:</strong> ${abordagem.observacoes}</p>` : ''}
            </div>
            <div class="mdl-card__actions mdl-card--border">
                <button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"
                        onclick="verDetalhes(${abordagem.id})">
                    Ver Detalhes
                </button>
            </div>
        </div>
    `;

    return div;
}

// Função global para ver detalhes
window.verDetalhes = async function(abordagemId) {
    try {
        const abordagem = await db.abordagens.get(abordagemId);
        const pessoa = await db.pessoas.get(abordagem.pessoaId);
        const veiculos = await db.veiculos
            .where('abordagemId')
            .equals(abordagem.id)
            .toArray();

        const acompanhantesIds = abordagem.acompanhantesIds || [];
        const acompanhantes = await Promise.all(
            acompanhantesIds.map(id => db.pessoas.get(id))
        );

        const data = new Date(abordagem.data).toLocaleString();
        const veiculosHtml = veiculos.map(v => `
            <div class="veiculo-detalhe">
                <p><strong>Tipo:</strong> ${v.tipo}</p>
                <p><strong>Marca/Modelo:</strong> ${v.marca}</p>
                <p><strong>Placa:</strong> ${v.placa}</p>
            </div>
        `).join('');

        const acompanhantesHtml = acompanhantes.map(a => `
            <div class="acompanhante-detalhe">
                <p><strong>Nome:</strong> ${a.nome}</p>
                <p><strong>RG:</strong> ${a.rg}</p>
                <p><strong>CPF:</strong> ${a.cpf}</p>
                <p><strong>Nome da Mãe:</strong> ${a.nomeMae}</p>
            </div>
        `).join('');

        const detalhes = document.querySelector('#detalhesAbordagem');
        detalhes.innerHTML = `
            <div class="detalhes-pessoa">
                <h5>Dados da Pessoa</h5>
                <p><strong>Nome:</strong> ${pessoa.nome}</p>
                <p><strong>Nome da Mãe:</strong> ${pessoa.nomeMae}</p>
                <p><strong>RG:</strong> ${pessoa.rg}</p>
                <p><strong>CPF:</strong> ${pessoa.cpf}</p>
                <p><strong>Endereço:</strong> ${pessoa.endereco}</p>
            </div>

            <div class="detalhes-abordagem">
                <h5>Dados da Abordagem</h5>
                <p><strong>Data:</strong> ${data}</p>
                <p><strong>Local:</strong> ${abordagem.localizacao.endereco}</p>
                <p><strong>Coordenadas:</strong> ${abordagem.localizacao.latitude}, ${abordagem.localizacao.longitude}</p>
                ${abordagem.observacoes ? `<p><strong>Observações:</strong> ${abordagem.observacoes}</p>` : ''}
            </div>

            ${abordagem.foto ? `
                <div class="detalhes-foto">
                    <h5>Foto</h5>
                    <img src="${abordagem.foto}" alt="Foto da abordagem" style="max-width: 100%; border-radius: 4px;">
                </div>
            ` : ''}

            ${veiculos.length > 0 ? `
                <div class="detalhes-veiculos">
                    <h5>Veículos</h5>
                    ${veiculosHtml}
                </div>
            ` : ''}

            ${acompanhantes.length > 0 ? `
                <div class="detalhes-acompanhantes">
                    <h5>Acompanhantes</h5>
                    ${acompanhantesHtml}
                </div>
            ` : ''}
        `;

        document.querySelector('#modalDetalhes').showModal();
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes da abordagem');
    }
}; 
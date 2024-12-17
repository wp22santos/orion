import { isAuthenticated, logout } from './auth.js';
import db from './db.js';

// Verifica autenticação
if (!isAuthenticated()) {
    window.location.replace('/');
}

// Elementos do DOM
const btnLogout = document.querySelector('#btnLogout');
const btnBackup = document.querySelector('#btnBackup');
const pessoasContainer = document.querySelector('#pessoasContainer');
const modalAbordagens = document.querySelector('#modalAbordagens');
const modalDetalhesAbordagem = document.querySelector('#modalDetalhesAbordagem');
const btnFecharAbordagens = document.querySelector('#btnFecharAbordagens');
const btnFecharDetalhes = document.querySelector('#btnFecharDetalhes');

// Event Listeners
btnLogout?.addEventListener('click', () => {
    logout();
    window.location.replace('/');
});

btnFecharAbordagens?.addEventListener('click', () => {
    modalAbordagens.close();
});

btnFecharDetalhes?.addEventListener('click', () => {
    modalDetalhesAbordagem.close();
});

// Funções
async function carregarPessoas() {
    try {
        const abordagens = await db.abordagens.toArray();
        const pessoas = new Map();

        // Agrupa as abordagens por pessoa
        abordagens.forEach(abordagem => {
            if (abordagem.envolvidos) {
                abordagem.envolvidos.forEach(pessoa => {
                    if (!pessoas.has(pessoa.nome)) {
                        pessoas.set(pessoa.nome, {
                            nome: pessoa.nome,
                            rg: pessoa.rg,
                            abordagens: []
                        });
                    }
                    pessoas.get(pessoa.nome).abordagens.push(abordagem);
                });
            }
        });

        // Limpa o container
        pessoasContainer.innerHTML = '';

        // Cria os cards
        pessoas.forEach(pessoa => {
            const card = criarCardPessoa(pessoa);
            pessoasContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Erro ao carregar pessoas:', error);
        alert('Erro ao carregar pessoas. Por favor, tente novamente.');
    }
}

function criarCardPessoa(pessoa) {
    const div = document.createElement('div');
    div.className = 'mdl-cell mdl-cell--4-col';
    div.innerHTML = `
        <div class="mdl-card mdl-shadow--2dp pessoa-card">
            <div class="mdl-card__title">
                <h2 class="mdl-card__title-text">${pessoa.nome}</h2>
            </div>
            <div class="mdl-card__supporting-text">
                <p>RG: ${pessoa.rg || 'Não informado'}</p>
                <p>Abordagens: ${pessoa.abordagens.length}</p>
            </div>
            <div class="mdl-card__actions mdl-card--border">
                <button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect btn-ver-abordagens">
                    Ver Abordagens
                </button>
            </div>
        </div>
    `;

    div.querySelector('.btn-ver-abordagens').addEventListener('click', () => {
        mostrarAbordagens(pessoa);
    });

    return div;
}

function mostrarAbordagens(pessoa) {
    const tituloPessoa = document.querySelector('#tituloPessoa');
    const listaAbordagens = document.querySelector('#listaAbordagens');
    
    tituloPessoa.textContent = pessoa.nome;
    listaAbordagens.innerHTML = '';

    pessoa.abordagens.forEach(abordagem => {
        const div = document.createElement('div');
        div.className = 'abordagem-card mdl-card mdl-shadow--2dp';
        div.innerHTML = `
            <div class="mdl-card__title">
                <h2 class="mdl-card__title-text">Data: ${new Date(abordagem.data).toLocaleDateString()}</h2>
            </div>
            <div class="mdl-card__supporting-text">
                <p>Local: ${abordagem.local}</p>
                <p>Motivo: ${abordagem.motivo}</p>
            </div>
            <div class="mdl-card__actions mdl-card--border">
                <button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect btn-ver-detalhes">
                    Ver Detalhes
                </button>
            </div>
        `;

        div.querySelector('.btn-ver-detalhes').addEventListener('click', () => {
            mostrarDetalhesAbordagem(abordagem);
        });

        listaAbordagens.appendChild(div);
    });

    modalAbordagens.showModal();
}

function mostrarDetalhesAbordagem(abordagem) {
    const content = modalDetalhesAbordagem.querySelector('.mdl-dialog__content');
    content.innerHTML = `
        <h5>Data e Hora</h5>
        <p>${new Date(abordagem.data).toLocaleString()}</p>
        
        <h5>Local</h5>
        <p>${abordagem.local}</p>
        
        <h5>Motivo</h5>
        <p>${abordagem.motivo}</p>
        
        <h5>Pessoas Envolvidas</h5>
        ${abordagem.envolvidos.map(pessoa => `
            <div class="pessoa-detalhe">
                <p><strong>Nome:</strong> ${pessoa.nome}</p>
                <p><strong>RG:</strong> ${pessoa.rg || 'Não informado'}</p>
                <p><strong>Atitude:</strong> ${pessoa.atitude || 'Não informado'}</p>
            </div>
        `).join('')}
        
        ${abordagem.veiculos ? `
            <h5>Veículos</h5>
            ${abordagem.veiculos.map(veiculo => `
                <div class="veiculo-detalhe">
                    <p><strong>Placa:</strong> ${veiculo.placa}</p>
                    <p><strong>Modelo:</strong> ${veiculo.modelo}</p>
                    <p><strong>Cor:</strong> ${veiculo.cor}</p>
                </div>
            `).join('')}
        ` : ''}
        
        ${abordagem.observacoes ? `
            <h5>Observações</h5>
            <p>${abordagem.observacoes}</p>
        ` : ''}
    `;

    modalDetalhesAbordagem.showModal();
}

// Carrega as pessoas ao iniciar
carregarPessoas(); 
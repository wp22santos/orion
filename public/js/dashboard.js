document.addEventListener('DOMContentLoaded', async () => {
    // Elementos do DOM
    const pessoasContainer = document.querySelector('#pessoasContainer');
    const modalAbordagens = document.querySelector('#modalAbordagens');
    const modalDetalhesAbordagem = document.querySelector('#modalDetalhesAbordagem');
    const btnFecharAbordagens = document.querySelector('#btnFecharAbordagens');
    const btnFecharDetalhes = document.querySelector('#btnFecharDetalhes');

    // Event Listeners
    btnFecharAbordagens.addEventListener('click', () => modalAbordagens.close());
    btnFecharDetalhes.addEventListener('click', () => modalDetalhesAbordagem.close());

    // Carregar todas as pessoas ao iniciar
    await carregarPessoas();

    async function carregarPessoas() {
        try {
            const pessoas = await db.pessoas.toArray();
            
            pessoasContainer.innerHTML = '';
            
            pessoas.forEach(pessoa => {
                const card = document.createElement('div');
                card.className = 'mdl-cell mdl-cell--3-col mdl-cell--4-col-tablet mdl-cell--12-col-phone';
                card.innerHTML = `
                    <div class="mdl-card mdl-shadow--2dp pessoa-card">
                        <div class="mdl-card__title">
                            ${pessoa.fotos && pessoa.fotos.length > 0 ? `
                                <div class="pessoa-foto">
                                    <img src="${pessoa.fotos[pessoa.fotos.length - 1].imagem}" 
                                         alt="Foto de ${pessoa.nome}"
                                         class="pessoa-foto-img">
                                </div>
                            ` : `
                                <div class="pessoa-foto sem-foto">
                                    <i class="material-icons">person</i>
                                </div>
                            `}
                        </div>
                        <div class="mdl-card__supporting-text">
                            <h4 class="pessoa-nome">${pessoa.nome}</h4>
                            <p class="pessoa-info">RG: ${pessoa.rg || 'Não informado'}</p>
                        </div>
                        <div class="mdl-card__actions mdl-card--border">
                            <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored btn-ver-abordagens">
                                <i class="material-icons">history</i> Ver Abordagens
                            </button>
                        </div>
                    </div>
                `;

                card.querySelector('.btn-ver-abordagens').addEventListener('click', () => {
                    mostrarAbordagensPessoa(pessoa);
                });

                pessoasContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar pessoas:', error);
            alert('Erro ao carregar lista de pessoas');
        }
    }

    async function mostrarAbordagensPessoa(pessoa) {
        const listaAbordagens = modalAbordagens.querySelector('#listaAbordagens');
        const tituloPessoa = modalAbordagens.querySelector('#tituloPessoa');
        
        tituloPessoa.textContent = pessoa.nome;
        console.log('Buscando abordagens para pessoa:', pessoa);

        try {
            // Buscar todas as abordagens
            const todasAbordagens = await db.abordagens.toArray();
            console.log('Todas abordagens:', todasAbordagens);
            
            // Filtrar apenas as abordagens que contêm a pessoa
            const abordagens = todasAbordagens.filter(abordagem => {
                console.log('Verificando abordagem:', abordagem);
                console.log('ID da pessoa:', pessoa.id);
                console.log('Array de abordados:', abordagem.abordados);
                // Converter para string para comparação
                return abordagem.abordados.map(String).includes(String(pessoa.id));
            }).sort((a, b) => new Date(b.data) - new Date(a.data));

            console.log('Abordagens filtradas:', abordagens);

            listaAbordagens.innerHTML = '';

            if (abordagens.length === 0) {
                listaAbordagens.innerHTML = '<p class="sem-abordagens">Nenhuma abordagem registrada</p>';
            } else {
                abordagens.forEach(abordagem => {
                    const data = new Date(abordagem.data);
                    const div = document.createElement('div');
                    div.className = 'mdl-card mdl-shadow--2dp abordagem-card';
                    div.innerHTML = `
                        <div class="mdl-card__title">
                            <h2 class="mdl-card__title-text">
                                ${data.toLocaleDateString()} às ${data.toLocaleTimeString()}
                            </h2>
                        </div>
                        <div class="mdl-card__supporting-text">
                            <p><strong>Local:</strong> ${abordagem.localizacao.endereco}</p>
                        </div>
                        <div class="mdl-card__actions mdl-card--border">
                            <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored btn-detalhes">
                                <i class="material-icons">visibility</i> Ver Detalhes
                            </button>
                        </div>
                    `;

                    div.querySelector('.btn-detalhes').addEventListener('click', () => {
                        mostrarDetalhesAbordagem(abordagem);
                    });

                    listaAbordagens.appendChild(div);
                });
            }

            modalAbordagens.showModal();
        } catch (error) {
            console.error('Erro ao carregar abordagens:', error);
            alert('Erro ao carregar abordagens da pessoa');
        }
    }

    async function mostrarDetalhesAbordagem(abordagem) {
        const conteudo = modalDetalhesAbordagem.querySelector('.mdl-dialog__content');
        const data = new Date(abordagem.data);

        try {
            // Buscar todas as pessoas desta abordagem
            const pessoas = await Promise.all(
                abordagem.abordados.map(id => db.pessoas.get(id))
            );

            conteudo.innerHTML = `
                <div class="detalhes-abordagem">
                    <h5>Data e Local</h5>
                    <p><strong>Data:</strong> ${data.toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> ${data.toLocaleTimeString()}</p>
                    <p><strong>Endereço:</strong> ${abordagem.localizacao.endereco}</p>
                    
                    <div id="mapaDetalhe" style="height: 200px; margin: 16px 0;"></div>

                    <h5>Pessoas Abordadas</h5>
                    <div class="pessoas-abordadas">
                        ${pessoas.map(pessoa => `
                            <div class="pessoa-abordada mdl-card mdl-shadow--2dp">
                                <div class="mdl-card__title">
                                    ${pessoa.fotos && pessoa.fotos.length > 0 ? `
                                        <div class="pessoa-foto">
                                            <img src="${pessoa.fotos[pessoa.fotos.length - 1].imagem}" 
                                                 alt="Foto de ${pessoa.nome}"
                                                 class="pessoa-foto-img">
                                        </div>
                                    ` : ''}
                                    <h2 class="mdl-card__title-text">${pessoa.nome}</h2>
                                </div>
                                <div class="mdl-card__supporting-text">
                                    <div class="mdl-grid">
                                        <div class="mdl-cell mdl-cell--6-col mdl-cell--12-col-tablet">
                                            <p><strong>RG:</strong> ${pessoa.rg || 'Não informado'}</p>
                                            <p><strong>CPF:</strong> ${pessoa.cpf || 'Não informado'}</p>
                                            <p><strong>Nome da Mãe:</strong> ${pessoa.nomeMae || 'Não informado'}</p>
                                        </div>
                                        <div class="mdl-cell mdl-cell--6-col mdl-cell--12-col-tablet">
                                            <p><strong>Nascimento:</strong> ${pessoa.nascimento || 'Não informado'}</p>
                                            <p><strong>Telefone:</strong> ${pessoa.telefone || 'Não informado'}</p>
                                            <p><strong>Endereço:</strong> ${pessoa.endereco || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    ${pessoa.observacoes ? `
                                        <p><strong>Observações:</strong> ${pessoa.observacoes}</p>
                                    ` : ''}
                                    ${pessoa.fotos && pessoa.fotos.length > 0 ? `
                                        <div class="fotos-preview">
                                            ${pessoa.fotos.map(foto => `
                                                <img src="${foto.imagem}" class="foto-miniatura" 
                                                    onclick="window.open('${foto.imagem}', '_blank')"
                                                    title="Foto de ${new Date(foto.data).toLocaleString()}">
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // Inicializar mapa
            const mapaDetalhe = L.map('mapaDetalhe').setView([abordagem.localizacao.latitude, abordagem.localizacao.longitude], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(mapaDetalhe);
            L.marker([abordagem.localizacao.latitude, abordagem.localizacao.longitude]).addTo(mapaDetalhe);

            modalDetalhesAbordagem.showModal();
        } catch (error) {
            console.error('Erro ao mostrar detalhes:', error);
            alert('Erro ao carregar detalhes da abordagem');
        }
    }
}); 
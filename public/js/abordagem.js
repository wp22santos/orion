document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const formAbordagem = document.querySelector('#formAbordagem');
    const btnAddAbordado = document.querySelector('#btnAddAbordado');
    const listaAbordados = document.querySelector('#listaAbordados');
    const modalResultadosBusca = document.querySelector('#modalResultadosBusca');
    const modalDetalhesPessoa = document.querySelector('#modalDetalhesPessoa');
    const modalGaleria = document.querySelector('#modalGaleria');
    const btnFecharModal = document.querySelector('#btnFecharModal');
    const btnFecharDetalhesPessoa = document.querySelector('#btnFecharDetalhesPessoa');
    const btnFecharGaleria = document.querySelector('#btnFecharGaleria');
    const resultadosBusca = document.querySelector('#resultadosBusca');

    // Variáveis do mapa
    let map = null;
    let marker = null;
    let latitude = null;
    let longitude = null;

    // Inicializar mapa
    initMap();

    // Inicializar data e hora atual
    const dataHora = document.querySelector('#dataHora');
    const agora = new Date();
    dataHora.value = agora.toISOString().slice(0, 16);
    dataHora.parentElement.classList.add('is-dirty');

    // Capturar localização atual
    obterLocalizacaoAtual();

    // Event Listeners
    btnAddAbordado.addEventListener('click', adicionarAbordado);
    formAbordagem.addEventListener('submit', salvarAbordagem);
    btnFecharModal.addEventListener('click', () => modalResultadosBusca.close());
    btnFecharDetalhesPessoa.addEventListener('click', () => modalDetalhesPessoa.close());
    btnFecharGaleria.addEventListener('click', () => modalGaleria.close());

    // Funções
    function initMap() {
        map = L.map('mapa').setView([-23.550520, -46.633308], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('click', (e) => {
            atualizarLocalizacao(e.latlng.lat, e.latlng.lng);
        });
    }

    async function obterLocalizacaoAtual() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            atualizarLocalizacao(position.coords.latitude, position.coords.longitude);
        } catch (error) {
            console.error('Erro ao obter localização:', error);
            alert('Não foi possível obter sua localização atual. Por favor, clique no mapa para definir o local da abordagem.');
        }
    }

    async function atualizarLocalizacao(lat, lng) {
        latitude = lat;
        longitude = lng;

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
        map.setView([lat, lng], 16);

        document.querySelector('#latitude').value = lat;
        document.querySelector('#longitude').value = lng;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            
            const endereco = document.querySelector('#endereco');
            endereco.value = data.display_name;
            endereco.parentElement.classList.add('is-dirty');
        } catch (error) {
            console.error('Erro ao obter endereço:', error);
        }
    }

    function adicionarAbordado() {
        const template = document.querySelector('#templateAbordado');
        const clone = document.importNode(template.content, true);
        
        // Adicionar eventos aos elementos do abordado
        const btnBuscar = clone.querySelector('.btn-buscar');
        const btnRemover = clone.querySelector('.remover-abordado');
        const btnFoto = clone.querySelector('.btn-foto');
        const btnGaleria = clone.querySelector('.btn-galeria');
        const camera = clone.querySelector('.camera');
        const fotoPreview = clone.querySelector('.foto-preview');
        const fotosPreview = clone.querySelector('.fotos-preview');
        const fotosData = clone.querySelector('.fotos-data');
        const inputNascimento = clone.querySelector('.nascimento');
        const inputTelefone = clone.querySelector('.telefone');
        
        let stream = null;
        let fotos = [];

        // Evento para captura de foto
        btnFoto.addEventListener('click', async () => {
            try {
                if (camera.style.display === 'none') {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    camera.srcObject = stream;
                    camera.style.display = 'block';
                    fotoPreview.style.display = 'none';
                    camera.play();
                    btnFoto.innerHTML = '<i class="material-icons">camera</i> Tirar Foto';
                } else {
                    const context = fotoPreview.getContext('2d');
                    fotoPreview.width = camera.videoWidth;
                    fotoPreview.height = camera.videoHeight;
                    context.drawImage(camera, 0, 0);
                    
                    // Adicionar nova foto ao array
                    fotos.push({
                        data: new Date(),
                        imagem: fotoPreview.toDataURL('image/jpeg')
                    });
                    
                    // Atualizar preview e dados
                    atualizarPreviewFotos();
                    fotosData.value = JSON.stringify(fotos);
                    
                    stream.getTracks().forEach(track => track.stop());
                    camera.style.display = 'none';
                    fotoPreview.style.display = 'none';
                    btnFoto.innerHTML = '<i class="material-icons">camera_alt</i> Nova Foto';
                    
                    if (fotos.length > 0) {
                        btnGaleria.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Erro ao acessar câmera:', error);
                alert('Erro ao acessar câmera. Verifique as permissões.');
            }
        });

        // Evento para ver galeria
        btnGaleria.addEventListener('click', () => {
            mostrarGaleria(fotos, (fotosAtualizadas) => {
                fotos = fotosAtualizadas;
                atualizarPreviewFotos();
                fotosData.value = JSON.stringify(fotos);
                if (fotos.length === 0) {
                    btnGaleria.style.display = 'none';
                }
            });
        });

        function atualizarPreviewFotos() {
            fotosPreview.innerHTML = '';
            fotos.slice(-4).forEach(foto => {
                const img = document.createElement('img');
                img.src = foto.imagem;
                img.className = 'foto-miniatura';
                img.addEventListener('click', () => {
                    mostrarGaleria(fotos, (fotosAtualizadas) => {
                        fotos = fotosAtualizadas;
                        atualizarPreviewFotos();
                        fotosData.value = JSON.stringify(fotos);
                        if (fotos.length === 0) {
                            btnGaleria.style.display = 'none';
                        }
                    });
                });
                fotosPreview.appendChild(img);
            });
        }
        
        // Adicionar máscaras
        inputNascimento.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 8) value = value.slice(0, 8);
            
            if (value.length >= 4) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
            } else if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            
            e.target.value = value;
        });

        inputTelefone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length >= 7) {
                value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7);
            } else if (value.length >= 2) {
                value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
            }
            
            e.target.value = value;
        });
        
        btnBuscar.addEventListener('click', async (e) => {
            const container = e.target.closest('.abordado-item');
            const termoBusca = container.querySelector('.buscar-pessoa').value;
            
            if (!termoBusca) return;
            
            try {
                const pessoas = await buscarPessoa(termoBusca);
                mostrarResultadosBusca(pessoas, container);
            } catch (error) {
                console.error('Erro ao buscar pessoa:', error);
                alert('Erro ao buscar pessoa');
            }
        });
        
        btnRemover.addEventListener('click', (e) => {
            const container = e.target.closest('.abordado-item');
            if (container.querySelector('.camera').srcObject) {
                container.querySelector('.camera').srcObject.getTracks().forEach(track => track.stop());
            }
            container.remove();
        });
        
        listaAbordados.appendChild(clone);
        componentHandler.upgradeDom();
    }

    function mostrarGaleria(fotos, callback) {
        const container = modalGaleria.querySelector('.galeria-container');
        container.innerHTML = '';

        fotos.forEach((foto, index) => {
            const div = document.createElement('div');
            div.className = 'galeria-item';
            div.innerHTML = `
                <img src="${foto.imagem}" alt="Foto ${index + 1}">
                <button class="mdl-button mdl-js-button mdl-button--icon btn-remover-foto">
                    <i class="material-icons">delete</i>
                </button>
                <div class="data-foto">${new Date(foto.data).toLocaleString()}</div>
            `;

            div.querySelector('.btn-remover-foto').addEventListener('click', () => {
                fotos.splice(index, 1);
                div.remove();
                if (fotos.length === 0) {
                    modalGaleria.close();
                }
                callback(fotos);
            });

            container.appendChild(div);
        });

        modalGaleria.showModal();
    }

    async function buscarPessoa(termo) {
        return await db.pessoas
            .where('rg').equals(termo)
            .or('cpf').equals(termo)
            .or('nome').startsWithIgnoreCase(termo)
            .toArray();
    }

    async function mostrarHistoricoPessoa(pessoa) {
        const dadosPessoa = document.querySelector('#dadosPessoa');
        const listaAbordagens = document.querySelector('#listaAbordagensPessoa');

        // Preencher dados da pessoa
        dadosPessoa.innerHTML = `
            <div class="mdl-grid">
                <div class="mdl-cell mdl-cell--6-col mdl-cell--12-col-tablet">
                    <p><strong>Nome:</strong> ${pessoa.nome}</p>
                    <p><strong>RG:</strong> ${pessoa.rg || 'Não informado'}</p>
                    <p><strong>CPF:</strong> ${pessoa.cpf || 'Não informado'}</p>
                </div>
                <div class="mdl-cell mdl-cell--6-col mdl-cell--12-col-tablet">
                    <p><strong>Nome da Mãe:</strong> ${pessoa.nomeMae || 'Não informado'}</p>
                    <p><strong>Nascimento:</strong> ${pessoa.nascimento || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> ${pessoa.endereco || 'Não informado'}</p>
                </div>
            </div>
            ${pessoa.fotos && pessoa.fotos.length > 0 ? `
                <div class="fotos-historico">
                    <h5>Fotos</h5>
                    <div class="fotos-preview">
                        ${pessoa.fotos.map(foto => `
                            <img src="${foto.imagem}" class="foto-miniatura" 
                                onclick="window.open('${foto.imagem}', '_blank')"
                                title="Foto de ${new Date(foto.data).toLocaleString()}">
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Buscar abordagens
        const abordagens = await db.abordagens
            .where('abordados')
            .equals(pessoa.id)
            .reverse()
            .toArray();

        // Limpar lista
        listaAbordagens.innerHTML = '';

        if (abordagens.length === 0) {
            listaAbordagens.innerHTML = '<p>Nenhuma abordagem anterior registrada.</p>';
            return;
        }

        // Preencher abordagens
        for (const abordagem of abordagens) {
            const div = document.createElement('div');
            div.className = 'mdl-card mdl-shadow--2dp';
            div.style.width = '100%';
            div.style.marginBottom = '16px';

            // Buscar outros abordados desta abordagem
            const outrosAbordados = await Promise.all(
                abordagem.abordados
                    .filter(id => id !== pessoa.id)
                    .map(id => db.pessoas.get(id))
            );

            div.innerHTML = `
                <div class="mdl-card__title">
                    <h2 class="mdl-card__title-text">
                        ${new Date(abordagem.data).toLocaleString()}
                    </h2>
                </div>
                <div class="mdl-card__supporting-text">
                    <p><strong>Local:</strong> ${abordagem.localizacao.endereco}</p>
                    ${outrosAbordados.length > 0 ? `
                        <p><strong>Acompanhantes:</strong></p>
                        <ul>
                            ${outrosAbordados.map(a => `
                                <li>
                                    <a href="#" class="link-pessoa" data-id="${a.id}">
                                        ${a.nome} (RG: ${a.rg || 'Não informado'})
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;

            // Adicionar eventos para links de pessoas
            div.querySelectorAll('.link-pessoa').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const pessoaId = e.target.dataset.id;
                    const pessoaRelacionada = await db.pessoas.get(parseInt(pessoaId));
                    if (pessoaRelacionada) {
                        mostrarHistoricoPessoa(pessoaRelacionada);
                    }
                });
            });

            listaAbordagens.appendChild(div);
        }

        modalDetalhesPessoa.showModal();
    }

    function mostrarResultadosBusca(pessoas, containerAbordado) {
        resultadosBusca.innerHTML = '';

        if (pessoas.length === 0) {
            resultadosBusca.innerHTML = '<p>Nenhuma pessoa encontrada</p>';
        } else {
            pessoas.forEach(pessoa => {
                const div = document.createElement('div');
                div.className = 'resultado-busca mdl-card mdl-shadow--2dp';
                div.innerHTML = `
                    <div class="mdl-card__title">
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
                                <p><strong>Endereço:</strong> ${pessoa.endereco || 'Não informado'}</p>
                            </div>
                        </div>
                        ${pessoa.fotos && pessoa.fotos.length > 0 ? `
                            <div class="fotos-preview">
                                ${pessoa.fotos.slice(-4).map(foto => `
                                    <img src="${foto.imagem}" class="foto-miniatura" 
                                        onclick="window.open('${foto.imagem}', '_blank')"
                                        title="Foto de ${new Date(foto.data).toLocaleString()}">
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="mdl-card__actions mdl-card--border">
                        <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored btn-selecionar">
                            Selecionar
                        </button>
                        <button class="mdl-button mdl-js-button mdl-button--raised btn-historico">
                            Ver Histórico
                        </button>
                    </div>
                `;

                div.querySelector('.btn-selecionar').addEventListener('click', () => {
                    preencherDadosAbordado(containerAbordado, pessoa);
                    modalResultadosBusca.close();
                });

                div.querySelector('.btn-historico').addEventListener('click', () => {
                    mostrarHistoricoPessoa(pessoa);
                });

                resultadosBusca.appendChild(div);
            });
        }

        modalResultadosBusca.showModal();
    }

    function preencherDadosAbordado(container, pessoa) {
        container.querySelector('.nome').value = pessoa.nome;
        container.querySelector('.nome-mae').value = pessoa.nomeMae;
        container.querySelector('.rg').value = pessoa.rg;
        container.querySelector('.cpf').value = pessoa.cpf;
        container.querySelector('.nascimento').value = pessoa.nascimento;
        container.querySelector('.telefone').value = pessoa.telefone || '';
        container.querySelector('.endereco').value = pessoa.endereco || '';

        // Se a pessoa tem fotos, preencher o preview
        if (pessoa.fotos && pessoa.fotos.length > 0) {
            const fotosPreview = container.querySelector('.fotos-preview');
            const fotosData = container.querySelector('.fotos-data');
            const btnGaleria = container.querySelector('.btn-galeria');
            
            fotosData.value = JSON.stringify(pessoa.fotos);
            btnGaleria.style.display = 'block';
            
            fotosPreview.innerHTML = '';
            pessoa.fotos.slice(-4).forEach(foto => {
                const img = document.createElement('img');
                img.src = foto.imagem;
                img.className = 'foto-miniatura';
                img.addEventListener('click', () => {
                    mostrarGaleria(JSON.parse(fotosData.value), (fotosAtualizadas) => {
                        fotosData.value = JSON.stringify(fotosAtualizadas);
                        if (fotosAtualizadas.length === 0) {
                            btnGaleria.style.display = 'none';
                        }
                        atualizarPreviewFotos(container, fotosAtualizadas);
                    });
                });
                fotosPreview.appendChild(img);
            });
        }

        container.querySelectorAll('.mdl-textfield').forEach(field => {
            field.classList.add('is-dirty');
        });
    }

    function atualizarPreviewFotos(container, fotos) {
        const fotosPreview = container.querySelector('.fotos-preview');
        fotosPreview.innerHTML = '';
        fotos.slice(-4).forEach(foto => {
            const img = document.createElement('img');
            img.src = foto.imagem;
            img.className = 'foto-miniatura';
            img.addEventListener('click', () => {
                mostrarGaleria(fotos, (fotosAtualizadas) => {
                    container.querySelector('.fotos-data').value = JSON.stringify(fotosAtualizadas);
                    if (fotosAtualizadas.length === 0) {
                        container.querySelector('.btn-galeria').style.display = 'none';
                    }
                    atualizarPreviewFotos(container, fotosAtualizadas);
                });
            });
            fotosPreview.appendChild(img);
        });
    }

    async function salvarAbordagem(e) {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const abordagem = {
                data: new Date(document.querySelector('#dataHora').value),
                localizacao: {
                    latitude,
                    longitude,
                    endereco: document.querySelector('#endereco').value
                },
                abordados: []
            };

            const abordadosElements = listaAbordados.querySelectorAll('.abordado-item');
            
            for (const element of abordadosElements) {
                const dadosAbordado = {
                    nome: element.querySelector('.nome').value.trim(),
                    nomeMae: element.querySelector('.nome-mae').value.trim(),
                    rg: element.querySelector('.rg').value.trim(),
                    cpf: element.querySelector('.cpf').value.trim(),
                    nascimento: element.querySelector('.nascimento').value.trim(),
                    telefone: element.querySelector('.telefone').value.trim(),
                    endereco: element.querySelector('.endereco').value.trim(),
                    observacoes: element.querySelector('.observacoes').value.trim()
                };

                // Processar fotos
                const fotosData = element.querySelector('.fotos-data').value;
                if (fotosData) {
                    dadosAbordado.fotos = JSON.parse(fotosData);
                }

                const pessoaId = await salvarPessoa(dadosAbordado);
                abordagem.abordados.push(pessoaId);
            }

            await db.abordagens.add(abordagem);

            alert('Abordagem salva com sucesso!');
            window.location.href = '/dashboard.html';

        } catch (error) {
            console.error('Erro ao salvar abordagem:', error);
            alert('Erro ao salvar abordagem. Por favor, tente novamente.');
            submitButton.disabled = false;
        }
    }

    async function salvarPessoa(dados) {
        let pessoa = null;
        
        if (dados.rg) {
            pessoa = await db.pessoas.where('rg').equals(dados.rg).first();
        }
        
        if (!pessoa && dados.cpf) {
            pessoa = await db.pessoas.where('cpf').equals(dados.cpf).first();
        }

        if (pessoa) {
            // Se a pessoa já existe, atualizar dados
            const dadosAtualizados = { ...dados };
            
            // Se tem fotos novas, adicionar ao array existente
            if (dados.fotos) {
                dadosAtualizados.fotos = [...(pessoa.fotos || []), ...dados.fotos];
            }
            
            await db.pessoas.update(pessoa.id, dadosAtualizados);
            return pessoa.id;
        } else {
            // Se é uma nova pessoa
            return await db.pessoas.add(dados);
        }
    }
});
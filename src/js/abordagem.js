import { isAuthenticated } from './auth.js';
import db from './db.js';

// Verifica autenticação
if (!isAuthenticated()) {
    window.location.replace('/');
}

// Elementos do DOM
const formAbordagem = document.querySelector('#formAbordagem');
const btnAddAbordado = document.querySelector('#btnAddAbordado');
const listaAbordados = document.querySelector('#listaAbordados');
const templateAbordado = document.querySelector('#templateAbordado');
const modalResultadosBusca = document.querySelector('#modalResultadosBusca');
const modalDetalhesPessoa = document.querySelector('#modalDetalhesPessoa');
const modalGaleria = document.querySelector('#modalGaleria');

// Mapa
let map = null;
let marker = null;

// Inicializa o mapa
function initMap() {
    map = L.map('mapa').setView([-23.5505, -46.6333], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Adiciona evento de clique no mapa
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }
        document.querySelector('#latitude').value = lat;
        document.querySelector('#longitude').value = lng;
    });
}

// Inicializa o mapa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initMap);

// Event Listeners
btnAddAbordado?.addEventListener('click', () => {
    const clone = document.importNode(templateAbordado.content, true);
    listaAbordados.appendChild(clone);
    
    // Inicializa os componentes MDL no clone
    componentHandler.upgradeElements(listaAbordados.lastElementChild);
    
    // Adiciona eventos aos botões do novo abordado
    const novoAbordado = listaAbordados.lastElementChild;
    initAbordadoEvents(novoAbordado);
});

formAbordagem?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const abordagem = {
            data: document.querySelector('#dataHora').value,
            local: document.querySelector('#endereco').value,
            coordenadas: {
                latitude: document.querySelector('#latitude').value,
                longitude: document.querySelector('#longitude').value
            },
            envolvidos: [],
            createdAt: new Date().toISOString()
        };
        
        // Coleta dados dos abordados
        const abordados = listaAbordados.querySelectorAll('.abordado-item');
        abordados.forEach(abordado => {
            const envolvido = {
                nome: abordado.querySelector('.nome').value,
                nomeMae: abordado.querySelector('.nome-mae').value,
                rg: abordado.querySelector('.rg').value,
                cpf: abordado.querySelector('.cpf').value,
                nascimento: abordado.querySelector('.nascimento').value,
                telefone: abordado.querySelector('.telefone').value,
                endereco: abordado.querySelector('.endereco').value,
                observacoes: abordado.querySelector('.observacoes').value,
                fotos: JSON.parse(abordado.querySelector('.fotos-data').value || '[]')
            };
            abordagem.envolvidos.push(envolvido);
        });
        
        // Salva no banco de dados
        await db.abordagens.add(abordagem);
        
        alert('Abordagem registrada com sucesso!');
        window.location.replace('/dashboard.html');
        
    } catch (error) {
        console.error('Erro ao salvar abordagem:', error);
        alert('Erro ao salvar abordagem. Por favor, tente novamente.');
    }
});

// Funções auxiliares
function initAbordadoEvents(abordadoElement) {
    // Botão de remover
    const btnRemover = abordadoElement.querySelector('.remover-abordado');
    btnRemover?.addEventListener('click', () => {
        abordadoElement.remove();
    });
    
    // Botão de busca
    const btnBuscar = abordadoElement.querySelector('.btn-buscar');
    btnBuscar?.addEventListener('click', async () => {
        const termo = abordadoElement.querySelector('.buscar-pessoa').value;
        if (!termo) {
            alert('Digite um termo para buscar');
            return;
        }
        
        try {
            const abordagens = await db.abordagens.toArray();
            const resultados = new Map();
            
            abordagens.forEach(abordagem => {
                abordagem.envolvidos.forEach(pessoa => {
                    if (pessoa.nome.toLowerCase().includes(termo.toLowerCase()) ||
                        pessoa.rg?.includes(termo) ||
                        pessoa.cpf?.includes(termo)) {
                        if (!resultados.has(pessoa.nome)) {
                            resultados.set(pessoa.nome, {
                                ...pessoa,
                                abordagens: []
                            });
                        }
                        resultados.get(pessoa.nome).abordagens.push(abordagem);
                    }
                });
            });
            
            mostrarResultadosBusca(Array.from(resultados.values()), abordadoElement);
            
        } catch (error) {
            console.error('Erro ao buscar:', error);
            alert('Erro ao realizar busca. Por favor, tente novamente.');
        }
    });
    
    // Botão de foto
    const btnFoto = abordadoElement.querySelector('.btn-foto');
    btnFoto?.addEventListener('click', () => {
        const camera = abordadoElement.querySelector('.camera');
        const preview = abordadoElement.querySelector('.foto-preview');
        
        if (camera.style.display === 'none') {
            iniciarCamera(camera, preview);
            camera.style.display = 'block';
            btnFoto.innerHTML = '<i class="material-icons">camera</i> Capturar';
        } else {
            capturarFoto(camera, preview, abordadoElement);
            camera.style.display = 'none';
            btnFoto.innerHTML = '<i class="material-icons">camera_alt</i> Nova Foto';
        }
    });
}

function mostrarResultadosBusca(resultados, abordadoElement) {
    const container = document.querySelector('#resultadosBusca');
    container.innerHTML = '';
    
    if (resultados.length === 0) {
        container.innerHTML = '<p>Nenhum resultado encontrado</p>';
        return;
    }
    
    resultados.forEach(pessoa => {
        const div = document.createElement('div');
        div.className = 'resultado-busca mdl-card mdl-shadow--2dp';
        div.innerHTML = `
            <div class="mdl-card__title">
                <h2 class="mdl-card__title-text">${pessoa.nome}</h2>
            </div>
            <div class="mdl-card__supporting-text">
                <p><strong>RG:</strong> ${pessoa.rg || 'Não informado'}</p>
                <p><strong>CPF:</strong> ${pessoa.cpf || 'Não informado'}</p>
                <p><strong>Abordagens:</strong> ${pessoa.abordagens.length}</p>
            </div>
            <div class="mdl-card__actions mdl-card--border">
                <button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect btn-selecionar">
                    Selecionar
                </button>
                <button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect btn-detalhes">
                    Ver Detalhes
                </button>
            </div>
        `;
        
        // Evento de selecionar pessoa
        div.querySelector('.btn-selecionar').addEventListener('click', () => {
            preencherDadosPessoa(pessoa, abordadoElement);
            modalResultadosBusca.close();
        });
        
        // Evento de ver detalhes
        div.querySelector('.btn-detalhes').addEventListener('click', () => {
            mostrarDetalhesPessoa(pessoa);
        });
        
        container.appendChild(div);
    });
    
    modalResultadosBusca.showModal();
}

function preencherDadosPessoa(pessoa, abordadoElement) {
    abordadoElement.querySelector('.nome').value = pessoa.nome;
    abordadoElement.querySelector('.nome-mae').value = pessoa.nomeMae || '';
    abordadoElement.querySelector('.rg').value = pessoa.rg || '';
    abordadoElement.querySelector('.cpf').value = pessoa.cpf || '';
    abordadoElement.querySelector('.nascimento').value = pessoa.nascimento || '';
    abordadoElement.querySelector('.telefone').value = pessoa.telefone || '';
    abordadoElement.querySelector('.endereco').value = pessoa.endereco || '';
    abordadoElement.querySelector('.observacoes').value = pessoa.observacoes || '';
    
    // Atualiza os componentes MDL
    const textfields = abordadoElement.querySelectorAll('.mdl-textfield');
    textfields.forEach(field => {
        field.classList.add('is-dirty');
        componentHandler.upgradeElement(field);
    });
}

async function iniciarCamera(camera, preview) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        camera.srcObject = stream;
        camera.play();
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        alert('Erro ao acessar câmera. Verifique as permissões.');
    }
}

function capturarFoto(camera, preview, abordadoElement) {
    preview.style.display = 'block';
    preview.width = camera.videoWidth;
    preview.height = camera.videoHeight;
    
    const context = preview.getContext('2d');
    context.drawImage(camera, 0, 0, preview.width, preview.height);
    
    // Converte para base64
    const dataUrl = preview.toDataURL('image/jpeg');
    
    // Adiciona à lista de fotos
    const fotosData = abordadoElement.querySelector('.fotos-data');
    const fotos = JSON.parse(fotosData.value || '[]');
    fotos.push({
        data: dataUrl,
        timestamp: new Date().toISOString()
    });
    fotosData.value = JSON.stringify(fotos);
    
    // Atualiza preview
    atualizarPreviewFotos(abordadoElement, fotos);
    
    // Para a câmera
    const stream = camera.srcObject;
    stream.getTracks().forEach(track => track.stop());
    camera.srcObject = null;
}

function atualizarPreviewFotos(abordadoElement, fotos) {
    const container = abordadoElement.querySelector('.fotos-preview');
    container.innerHTML = '';
    
    fotos.forEach((foto, index) => {
        const img = document.createElement('img');
        img.src = foto.data;
        img.className = 'foto-miniatura';
        img.addEventListener('click', () => {
            mostrarGaleria(fotos, index);
        });
        container.appendChild(img);
    });
    
    // Mostra/esconde botão da galeria
    const btnGaleria = abordadoElement.querySelector('.btn-galeria');
    btnGaleria.style.display = fotos.length > 0 ? 'inline-block' : 'none';
}

function mostrarGaleria(fotos, indexAtual = 0) {
    const container = modalGaleria.querySelector('.galeria-container');
    container.innerHTML = '';
    
    fotos.forEach((foto, index) => {
        const div = document.createElement('div');
        div.className = 'galeria-item';
        div.innerHTML = `
            <img src="${foto.data}" alt="Foto ${index + 1}">
            <button class="mdl-button mdl-js-button mdl-button--icon btn-remover-foto">
                <i class="material-icons">delete</i>
            </button>
            <div class="data-foto">
                ${new Date(foto.timestamp).toLocaleString()}
            </div>
        `;
        
        // Evento para remover foto
        div.querySelector('.btn-remover-foto').addEventListener('click', () => {
            fotos.splice(index, 1);
            mostrarGaleria(fotos);
            atualizarPreviewFotos(abordadoElement, fotos);
            fotosData.value = JSON.stringify(fotos);
        });
        
        container.appendChild(div);
    });
    
    modalGaleria.showModal();
} 
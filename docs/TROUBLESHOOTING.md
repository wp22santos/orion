# Documentação de Problemas e Soluções

## 1. Tela de Login/Registro
### Problema: Formulário sem estilo Material Design
**Sintomas:**
- Formulário aparecendo sem estilização
- Campos de texto simples sem animação
- Botões sem estilo Material Design

**Solução:**
1. Corrigir ordem dos arquivos CSS no `index.html`:
```html
<!-- Material Design Lite primeiro -->
<link rel="stylesheet" href="https://code.getmdl.io/1.3.0/material.indigo-blue.min.css">
<!-- Depois nosso CSS personalizado -->
<link rel="stylesheet" href="styles/main.css">
```

2. Adicionar classes corretas do Material Design:
```html
<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
    <input class="mdl-textfield__input" type="email" id="loginEmail">
    <label class="mdl-textfield__label" for="loginEmail">E-mail</label>
</div>
```

3. Estilos CSS específicos:
```css
.form-container {
    max-width: 400px;
    margin: 4rem auto;
    padding: 0 1rem;
}

.mdl-card__title {
    background-color: #3f51b5;
    color: white;
}
```

### Problema: Alternância entre Login/Registro não funcionava
**Solução:**
```javascript
// No app.js
btnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    registroForm.style.display = 'none';
});

btnRegistro.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registroForm.style.display = 'block';
});
```

## 2. Busca no Dashboard
### Problema: Busca não dinâmica e limitada
**Sintomas:**
- Busca não atualiza em tempo real
- Não pesquisa em todos os campos
- Performance ruim com muitos registros

**Solução:**
1. Implementar busca dinâmica com debounce:
```javascript
let timeoutId;
termoBusca.addEventListener('input', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(realizarBusca, 300);
});
```

2. Buscar em todos os campos relevantes:
```javascript
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
    a?.cpf?.toLowerCase().includes(termo)
) ||

// Campos dos veículos
veiculosAbordagem.some(v => 
    v?.placa?.toLowerCase().includes(termo) ||
    v?.marca?.toLowerCase().includes(termo) ||
    v?.modelo?.toLowerCase().includes(termo)
) ||

// Campos da abordagem
abordagem.localizacao?.endereco?.toLowerCase().includes(termo) ||
abordagem.observacoes?.toLowerCase().includes(termo)
```

3. Otimizar performance:
```javascript
// Criar índices para busca rápida
const pessoasIndex = new Map(pessoas.map(p => [p.id, p]));
const veiculosPorAbordagem = veiculos.reduce((acc, v) => {
    if (!acc[v.abordagemId]) acc[v.abordagemId] = [];
    acc[v.abordagemId].push(v);
    return acc;
}, {});
```

## 3. Boas Práticas Gerais
1. Sempre atualizar componentes MDL após modificações dinâmicas:
```javascript
componentHandler.upgradeDom();
```

2. Usar tratamento de erros adequado:
```javascript
try {
    // código...
} catch (error) {
    console.error('Erro:', error);
    alert('Mensagem amigável para o usuário');
}
```

3. Validar dados antes de salvar:
```javascript
if (!termo && !dataInicio && !dataFim) {
    document.querySelector('#resultadosBusca').innerHTML = '';
    return;
}
```

## 4. Tratamento de Acompanhantes
### Problema: Acompanhantes não cadastrados e múltiplos acompanhantes
**Sintomas:**
- Acompanhantes não cadastrados não apareciam na busca
- Não era possível diferenciar acompanhantes cadastrados e não cadastrados
- Erros ao tentar acessar dados de acompanhantes inexistentes

**Solução:**
1. Separar tipos de acompanhantes:
```javascript
// Buscar acompanhantes cadastrados
const acompanhantesIds = abordagem.acompanhantesIds || [];
const acompanhantes = acompanhantesIds
    .map(id => pessoasIndex.get(id))
    .filter(Boolean);

// Buscar acompanhantes não cadastrados
const acompanhantesNaoCadastrados = abordagem.acompanhantesTemp || [];
```

2. Buscar em todos os tipos:
```javascript
// Campos dos acompanhantes cadastrados
acompanhantes.some(a => 
    a.nome?.toLowerCase().includes(termo) ||
    a.rg?.toLowerCase().includes(termo)
) ||

// Campos dos acompanhantes não cadastrados
acompanhantesNaoCadastrados.some(a => 
    a.nome?.toLowerCase().includes(termo) ||
    a.rg?.toLowerCase().includes(termo)
)
```

3. Exibição clara do status:
```javascript
const todosAcompanhantes = [
    ...acompanhantes.map(a => ({ nome: a.nome, tipo: 'Cadastrado' })),
    ...acompanhantesTemp.map(a => ({ nome: a.nome, tipo: 'Não Cadastrado' }))
];

const acompanhantesTexto = todosAcompanhantes.length > 0 
    ? `<p><strong>Acompanhantes:</strong><br>
       ${todosAcompanhantes.map(a => 
           `${a.nome} <small>(${a.tipo})</small>`
       ).join('<br>')}</p>` 
    : '';
```

4. Tratamento de erros:
```javascript
// Verificar pessoa principal
const pessoa = pessoasIndex.get(abordagem.pessoaId);
if (!pessoa) return false; // Ignora abordagem se pessoa não existir

// Tratar campos nulos
pessoa.nome?.toLowerCase().includes(termo) ||
pessoa.rg?.toLowerCase().includes(termo)
```

### Boas Práticas para Acompanhantes:
1. Sempre verificar existência antes de acessar:
```javascript
const acompanhantesIds = abordagem.acompanhantesIds || [];
const acompanhantesTemp = abordagem.acompanhantesTemp || [];
```

2. Usar filter(Boolean) para remover valores inválidos:
```javascript
const acompanhantes = acompanhantesIds
    .map(id => pessoasIndex.get(id))
    .filter(Boolean);
```

3. Separar claramente os tipos de acompanhantes na interface:
```javascript
// Combinar e identificar tipos
const todosAcompanhantes = [
    ...acompanhantes.map(a => ({ nome: a.nome, tipo: 'Cadastrado' })),
    ...acompanhantesTemp.map(a => ({ nome: a.nome, tipo: 'Não Cadastrado' }))
];
``` 
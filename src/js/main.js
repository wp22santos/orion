import { login, register, isAuthenticated } from './auth.js';
import db from './db.js';

// Verifica se já está autenticado
if (isAuthenticated() && window.location.pathname === '/') {
    window.location.replace('/dashboard.html');
}

// Elementos do DOM
const loginForm = document.querySelector('#loginForm form');
const registroForm = document.querySelector('#registroForm form');
const btnLogin = document.querySelector('#btnLogin');
const btnRegistro = document.querySelector('#btnRegistro');

// Mostra o formulário de login por padrão
if (document.querySelector('#loginForm')) {
    document.querySelector('#loginForm').style.display = 'block';
}
if (document.querySelector('#registroForm')) {
    document.querySelector('#registroForm').style.display = 'none';
}

// Event Listeners
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#loginEmail').value;
    const senha = document.querySelector('#loginSenha').value;
    
    console.log('Tentando fazer login...');
    
    try {
        const loginSuccess = await login(email, senha);
        console.log('Resultado do login:', loginSuccess);
        
        if (loginSuccess) {
            console.log('Login bem sucedido, redirecionando...');
            window.location.replace('/dashboard.html');
        } else {
            console.log('Login falhou');
            alert('Email ou senha inválidos');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Erro ao fazer login. Por favor, tente novamente.');
    }
});

registroForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#registroEmail').value;
    const senha = document.querySelector('#registroSenha').value;
    const confirmaSenha = document.querySelector('#confirmaSenha').value;
    
    if (!email || !senha || !confirmaSenha) {
        alert('Por favor, preencha todos os campos');
        return;
    }
    
    if (senha !== confirmaSenha) {
        alert('As senhas não coincidem');
        return;
    }
    
    console.log('Tentando registrar usuário...');
    
    try {
        const registerSuccess = await register(email, senha);
        console.log('Resultado do registro:', registerSuccess);
        
        if (registerSuccess) {
            console.log('Registro bem sucedido');
            alert('Usuário registrado com sucesso');
            
            // Após registrar, faz login automaticamente
            const loginSuccess = await login(email, senha);
            console.log('Resultado do login automático:', loginSuccess);
            
            if (loginSuccess) {
                console.log('Login automático bem sucedido, redirecionando...');
                window.location.replace('/dashboard.html');
            } else {
                console.log('Login automático falhou');
                alert('Registro concluído, mas houve um erro ao fazer login. Por favor, faça login manualmente.');
                // Mostra o formulário de login
                if (btnLogin) btnLogin.click();
            }
        } else {
            console.log('Registro falhou');
            alert('Erro ao registrar usuário. O email já pode estar em uso.');
        }
    } catch (error) {
        console.error('Erro ao registrar:', error);
        alert('Erro ao registrar usuário. Por favor, tente novamente.');
    }
});

// Alternar entre formulários
btnLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    const loginForm = document.querySelector('#loginForm');
    const registroForm = document.querySelector('#registroForm');
    if (loginForm) loginForm.style.display = 'block';
    if (registroForm) registroForm.style.display = 'none';
});

btnRegistro?.addEventListener('click', (e) => {
    e.preventDefault();
    const loginForm = document.querySelector('#loginForm');
    const registroForm = document.querySelector('#registroForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registroForm) registroForm.style.display = 'block';
}); 
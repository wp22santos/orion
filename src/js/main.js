import { login, register, isAuthenticated } from './auth.js';
import db from './db.js';

// Verifica se já está autenticado
if (isAuthenticated()) {
    window.location.href = '/dashboard.html';
}

// Elementos do DOM
const loginForm = document.querySelector('#loginForm form');
const registroForm = document.querySelector('#registroForm form');
const btnLogin = document.querySelector('#btnLogin');
const btnRegistro = document.querySelector('#btnRegistro');

// Mostra o formulário de login por padrão
document.querySelector('#loginForm').style.display = 'block';
document.querySelector('#registroForm').style.display = 'none';

// Event Listeners
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#loginEmail').value;
    const senha = document.querySelector('#loginSenha').value;
    
    console.log('Tentando fazer login...');
    
    try {
        if (await login(email, senha)) {
            console.log('Login bem sucedido, redirecionando...');
            window.location.href = '/dashboard.html';
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
        if (await register(email, senha)) {
            console.log('Registro bem sucedido');
            alert('Usuário registrado com sucesso');
            // Após registrar, faz login automaticamente
            if (await login(email, senha)) {
                console.log('Login automático bem sucedido, redirecionando...');
                window.location.href = '/dashboard.html';
            } else {
                console.log('Login automático falhou');
                alert('Registro concluído, mas houve um erro ao fazer login. Por favor, faça login manualmente.');
                // Mostra o formulário de login
                btnLogin.click();
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
    document.querySelector('#loginForm').style.display = 'block';
    document.querySelector('#registroForm').style.display = 'none';
});

btnRegistro?.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('#loginForm').style.display = 'none';
    document.querySelector('#registroForm').style.display = 'block';
}); 
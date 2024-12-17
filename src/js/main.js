import { login, register } from './auth.js';
import db from './db.js';

// Elementos do DOM
const loginForm = document.querySelector('#loginForm form');
const registroForm = document.querySelector('#registroForm form');
const btnLogin = document.querySelector('#btnLogin');
const btnRegistro = document.querySelector('#btnRegistro');

// Event Listeners
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#loginEmail').value;
    const senha = document.querySelector('#loginSenha').value;
    
    if (await login(email, senha)) {
        window.location.href = '/dashboard.html';
    } else {
        alert('Email ou senha inválidos');
    }
});

registroForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#registroEmail').value;
    const senha = document.querySelector('#registroSenha').value;
    const confirmaSenha = document.querySelector('#confirmaSenha').value;
    
    if (senha !== confirmaSenha) {
        alert('As senhas não coincidem');
        return;
    }
    
    if (await register(email, senha)) {
        alert('Usuário registrado com sucesso');
        window.location.href = '/dashboard.html';
    } else {
        alert('Erro ao registrar usuário');
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
import CryptoJS from 'crypto-js';
import db from './db.js';

function hashPassword(password) {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

export async function login(email, password) {
    try {
        console.log('Tentando login com email:', email);
        const hashedPassword = hashPassword(password);
        const user = await db.users.where('email').equals(email).first();
        
        console.log('Usuário encontrado:', user);
        
        if (!user) {
            console.log('Usuário não encontrado');
            return false;
        }
        
        console.log('Comparando senhas:', {
            stored: user.password,
            provided: hashedPassword
        });
        
        if (user.password === hashedPassword) {
            console.log('Senha correta, login bem sucedido');
            // Armazena o usuário na sessão
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                email: user.email
            }));
            return true;
        }
        
        console.log('Senha incorreta');
        return false;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return false;
    }
}

export async function register(email, password) {
    try {
        console.log('Tentando registrar usuário:', email);
        
        // Verifica se o usuário já existe
        const existingUser = await db.users.where('email').equals(email).first();
        if (existingUser) {
            console.log('Usuário já existe');
            return false;
        }
        
        const hashedPassword = hashPassword(password);
        console.log('Senha hasheada:', hashedPassword);
        
        const id = await db.users.add({
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        });
        
        console.log('Usuário registrado com sucesso:', {
            id,
            email,
            hashedPassword
        });
        return true;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return false;
    }
}

export function isAuthenticated() {
    const user = sessionStorage.getItem('currentUser');
    console.log('Verificando autenticação:', user);
    return user !== null;
}

export function logout() {
    sessionStorage.removeItem('currentUser');
    console.log('Usuário deslogado');
} 
import CryptoJS from 'crypto-js';
import db from './db.js';

export async function login(email, password) {
    const hashedPassword = CryptoJS.SHA256(password).toString();
    const user = await db.users.where('email').equals(email).first();
    
    if (user && user.password === hashedPassword) {
        return true;
    }
    return false;
}

export async function register(email, password) {
    const hashedPassword = CryptoJS.SHA256(password).toString();
    try {
        await db.users.add({
            email,
            password: hashedPassword
        });
        return true;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return false;
    }
} 
class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
    }

    async login(email, password) {
        try {
            if (!email || !password) {
                throw new Error('E-mail e senha são obrigatórios');
            }

            const user = await db.usuarios.where('email').equals(email).first();
            if (!user) {
                throw new Error('Usuário não encontrado');
            }

            const hashedPassword = CryptoJS.PBKDF2(password, user.salt, {
                keySize: 256/32,
                iterations: 1000
            }).toString();

            if (hashedPassword !== user.password) {
                throw new Error('Senha incorreta');
            }

            this.isAuthenticated = true;
            this.currentUser = {
                id: user.id,
                email: user.email
            };

            localStorage.setItem('userSession', JSON.stringify({
                userId: user.id,
                email: user.email
            }));

            return this.currentUser;
        } catch (error) {
            throw error;
        }
    }

    async register(email, password) {
        try {
            if (!email || !password) {
                throw new Error('E-mail e senha são obrigatórios');
            }

            if (!email.includes('@')) {
                throw new Error('E-mail inválido');
            }

            if (password.length < 6) {
                throw new Error('A senha deve ter pelo menos 6 caracteres');
            }

            const existingUser = await db.usuarios.where('email').equals(email).first();
            if (existingUser) {
                throw new Error('E-mail já cadastrado');
            }

            const salt = CryptoJS.lib.WordArray.random(128/8).toString();
            const hashedPassword = CryptoJS.PBKDF2(password, salt, {
                keySize: 256/32,
                iterations: 1000
            }).toString();

            const userId = await db.usuarios.add({
                email,
                password: hashedPassword,
                salt,
                createdAt: new Date().toISOString()
            });

            await this.login(email, password);
            return userId;
        } catch (error) {
            throw error;
        }
    }

    async checkSession() {
        try {
            const savedSession = localStorage.getItem('userSession');
            if (!savedSession) {
                return false;
            }

            const session = JSON.parse(savedSession);
            const user = await db.usuarios.get(session.userId);
            
            if (user && user.email === session.email) {
                this.isAuthenticated = true;
                this.currentUser = {
                    id: user.id,
                    email: user.email
                };
                return true;
            }

            this.logout();
            return false;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('userSession');
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

window.auth = new Auth(); 
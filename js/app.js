document.addEventListener('DOMContentLoaded', async () => {
    // Verificar se já está logado
    const hasSession = await auth.checkSession();
    if (hasSession) {
        window.location.replace('/dashboard.html');
        return;
    }

    // Configurar formulários
    const loginForm = document.querySelector('#loginForm');
    const registroForm = document.querySelector('#registroForm');
    const btnLogin = document.querySelector('#btnLogin');
    const btnRegistro = document.querySelector('#btnRegistro');

    // Mostrar formulário de login por padrão
    loginForm.style.display = 'block';
    registroForm.style.display = 'none';

    // Alternar entre formulários
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

    // Login
    loginForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const email = document.querySelector('#loginEmail').value.trim();
            const senha = document.querySelector('#loginSenha').value;
            await auth.login(email, senha);
            window.location.replace('/dashboard.html');
        } catch (error) {
            alert(error.message);
            submitButton.disabled = false;
        }
    });

    // Registro
    registroForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const email = document.querySelector('#registroEmail').value.trim();
            const senha = document.querySelector('#registroSenha').value;
            const confirmaSenha = document.querySelector('#confirmaSenha').value;

            if (senha !== confirmaSenha) {
                throw new Error('As senhas não coincidem');
            }

            await auth.register(email, senha);
            window.location.replace('/dashboard.html');
        } catch (error) {
            alert(error.message);
            submitButton.disabled = false;
        }
    });
}); 
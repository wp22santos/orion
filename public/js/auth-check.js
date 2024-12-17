// Verificação de autenticação para páginas internas
window.addEventListener('load', async () => {
    try {
        const hasSession = await auth.checkSession();
        if (!hasSession) {
            window.location.replace('/index.html');
            return;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.replace('/index.html');
    }
}); 
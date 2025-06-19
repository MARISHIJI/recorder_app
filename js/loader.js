document.addEventListener("DOMContentLoaded", function() {
    // ヘッダーを読み込む
    fetch('header.html')
        .then(response => {
            if (!response.ok) { throw new Error('header.html not found'); }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            
            // 現在のページに応じてナビゲーションリンクに 'current' クラスを設定
            // index.html or empty path should highlight the first link
            const path = window.location.pathname.split('/').pop();
            const currentPage = (path === '' || path === 'index.html') ? 'index.html' : path;

            const navLinks = document.querySelectorAll('.main-nav a');
            navLinks.forEach(link => {
                const linkPage = link.getAttribute('href').split('/').pop();
                if (linkPage === currentPage) {
                    link.classList.add('current');
                }
            });
        })
        .catch(error => console.error('Error loading header:', error));

    // フッターを読み込む
    fetch('footer.html')
        .then(response => {
            if (!response.ok) { throw new Error('footer.html not found'); }
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
});
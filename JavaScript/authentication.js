let isAuthenticated = document.cookie.includes("isAuthenticated=true");
let isAdmin = document.cookie.includes("role=admin");
const loginLogoutFooter = document.getElementById('login-logout-footer');

function setLoginLogoutLink() {
    if (isAuthenticated) {
        document.getElementById('login-option').style.display = 'none';
        document.getElementById('profile-option').style.display = 'block';
        document.getElementById('championships-option').style.display = 'block';
        document.getElementById('last-race-option').style.display = 'block';
        document.getElementById('logout-option').style.display = 'block';
        loginLogoutFooter.textContent = 'Logout';
        loginLogoutFooter.href = 'index.html';
    } else {
        document.getElementById('login-option').style.display = 'block';
        document.getElementById('profile-option').style.display = 'none';
        document.getElementById('championships-option').style.display = 'none';
        document.getElementById('last-race-option').style.display = 'none';
        document.getElementById('logout-option').style.display = 'none';
        loginLogoutFooter.textContent = 'Login';
        loginLogoutFooter.href = 'login.html';
    }
}

// For footer handling of login/logout button
function toggleLoginLogout() {
    if (isAuthenticated) {
        logout();
    } else {
        window.location.href = "login.html";
    }
}

// Initial setup
setLoginLogoutLink();
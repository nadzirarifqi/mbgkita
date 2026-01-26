// 1. CONFIGURATION
const scriptURL = 'https://script.google.com/macros/s/AKfycbytLLtPefPOqbqZjp4rQVPSii91xS_OpIvIPQW6Q7WG9u1lJ_4mWvBl1QmAjfiXM5NcIw/exec';
 // Replace with your actual Web App URL
const USER_SHEET = 'Users'; // The exact name of your Tab in Google Sheets

/// --- LOGIN HANDLER (Only runs if on login.html) ---
/// --- LOGIN HANDLER ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const user = document.getElementById('logUser').value;
        const pass = document.getElementById('logPass').value;
        const loginURL = `${scriptURL}?action=login&targetSheet=${USER_SHEET}&username=${user}&password=${pass}`;
        
        fetch(loginURL)
            .then(res => res.json())
            .then(data => {
               if (data.status === "Authenticated") {
                    sessionStorage.setItem('userID', data.userId);
                    sessionStorage.setItem('userName', data.owner);
                    sessionStorage.setItem('userRole', data.role);
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('loginTime', new Date().getTime());
                    
                    // SIMPAN LOG LOGIN KE SHEETS
                    const details = encodeURIComponent(`Login sukses via Web Dashboard`);
                    fetch(`${scriptURL}?action=logOnly&userId=${data.userId}&name=${data.owner}&event=Login&details=${details}`);

                    Swal.fire({ title: `Welcome, ${data.owner}!`, icon: 'success', timer: 1500, showConfirmButton: false })
                        .then(() => window.location.href = "terms.html");
                } else {
                    Swal.fire('Gagal', 'Kredensial salah.', 'error');
                }

            });
        }
    )};


// --- REGISTRATION HANDLER (Only runs if on register.html) ---
const regForm = document.getElementById('regForm');
if (regForm) {
    regForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = {
            owner: document.getElementById('regOwner').value,
            username: document.getElementById('regUser').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            password: document.getElementById('regPass').value,
            role: document.getElementById('regRole').value
        };

        fetch(`${scriptURL}?action=register&targetSheet=${USER_SHEET}`, {
            method: 'POST',
            body: JSON.stringify(formData)
        })
        .then(res => res.text())
        .then(response => {
            if (response.includes("Successful")) {
                Swal.fire('Berhasil!', 'Akun Anda telah dibuat.', 'success').then(() => {
                    window.location.href = "index.html";
                });
            } else {
                Swal.fire('Gagal', response, 'error');
            }
        });
    });
}

function handleRedirection(role) {
    if (role === "Recipe Developer") window.location.href = "developer_dashboard.html";
    else if (role === "Menu Planner") window.location.href = "planner_dashboard.html";
    else if (role === "Supplier") window.location.href = "supplier_dashboard.html";
}
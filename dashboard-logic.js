// 1. CONFIGURATION & SESSION RETRIEVAL
const scriptURL = 'https://script.google.com/macros/s/AKfycbytLLtPefPOqbqZjp4rQVPSii91xS_OpIvIPQW6Q7WG9u1lJ_4mWvBl1QmAjfiXM5NcIw/exec'; 

// Data is now pulled from sessionStorage for better security
const userID = sessionStorage.getItem('userID');
const userName = sessionStorage.getItem('userName');
const userRole = sessionStorage.getItem('userRole');

// Note: Route Protection is handled by auth-guard.js, 
// so we don't need a manual redirect check here anymore.

document.addEventListener('DOMContentLoaded', () => {
    // Set UI Texts from Session
    const welcomeEl = document.getElementById('welcomeText');
    if (welcomeEl) welcomeEl.innerText = `Hi, ${userName}`;
    
    // Populate Profile Dropdown info
    const dName = document.getElementById('dropdownName');
    const dRole = document.getElementById('dropdownRole');
    if (dName) dName.innerText = userName;
    if (dRole) dRole.innerText = userRole;

    // Initialize Dashboard Components
    loadUsageChart(); 
    fetchUserRecipes();
    fetchActivityLogs();

    function startAutoRefresh() {// Tambahkan ini di bagian bawah DOMContentLoaded pada dashboard-logic.js
        setInterval(() => {
            console.log("Menyegarkan data resep dan log...");
            fetchUserRecipes();
            fetchActivityLogs();
        }, 30000); // Segarkan setiap 5 menit (300.000 ms)
    }

    startAutoRefresh();
});

// 2. PROFILE DROPDOWN LOGIC (PC & Mobile)
function toggleProfileMenu(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('profileDropdown');
    const icon = document.getElementById('profileIcon');
    if (dropdown && dropdown.classList.contains('active')) {
        if (!icon.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    }
});

// 3. CHART LOGIC
function loadUsageChart() {
    const canvas = document.getElementById('usageChart');
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Recipe Usage',
                data: [65, 45, 75, 50, 60, 55, 90, 40, 70, 80, 65, 58],
                backgroundColor: '#95bb11',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { display: false, beginAtZero: true },
                x: { grid: { display: false } }
            }
        }
    });
}

// 4. FETCH DATA (Filtering by Session UserID)
function fetchUserRecipes() {
    const menuList = document.getElementById('menuList');
    // Tambahkan timestamp unik agar browser tidak mengambil data cache lama
    fetch(`${scriptURL}?action=readAll&targetSheet=Menu%20Databases&t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
            const myRecipes = data.filter(item => item.UserID === userID);
            renderRecipes(myRecipes);
        })
        .catch(err => console.error("Fetch error:", err));
}

// Fungsi untuk mengambil log dari Apps Script
function fetchActivityLogs() {
    const logContainer = document.getElementById('activityLogList');
    if (!logContainer) return;

    // Pastikan userID diambil dari sessionStorage
    const currentUserID = sessionStorage.getItem('userID');

    // Tambahkan parameter &userId= ke URL fetch
    fetch(`${scriptURL}?action=readLogs&userId=${currentUserID}`)
        .then(res => res.json())
        .then(data => {
            renderLogs(data);
        })
        .catch(err => {
            console.error("Gagal memuat log:", err);
            logContainer.innerHTML = "<li class='log-item'>Gagal memuat aktivitas.</li>";
        });
}

// Render logs into the UI
function renderLogs(logs) {
    const logContainer = document.getElementById('activityLogList');
    if (!logContainer) return;
    
    logContainer.innerHTML = "";

    if (!logs || logs.length === 0) {
        logContainer.innerHTML = "<li class='log-item' style='text-align:center; color:#999; padding:10px;'>Belum ada aktivitas.</li>";
        return;
    }

    logs.forEach(log => {
        // Format Tanggal
        let dateStr = "Baru saja";
        if (log.timestamp) {
            const d = new Date(log.timestamp);
            dateStr = d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        }

        const logItem = `
            <li class="log-item">
                <div class="log-header">
                    <span class="log-user"><strong>${log.name || 'System'}</strong></span>
                    <span class="log-time">${dateStr}</span>
                </div>
                <p class="log-details">${log.activity_log || 'Melakukan tindakan'}</p>
            </li>
        `;
        logContainer.insertAdjacentHTML('beforeend', logItem);
    });
}

// 5. RENDER UI CARDS (Vertical Stack Style)
function renderRecipes(recipes) {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    
    // Simpan HTML baru ke variabel dulu
    let newHTML = ""; 

    if (recipes.length === 0) {
        newHTML = "<p style='text-align:center; color:#888; padding:20px;'>Belum ada resep.</p>";
    } else {
        recipes.forEach(recipe => {
            const currentStatus = recipe.Status || 'Waiting';
            const statusClass = currentStatus.toLowerCase().replace(/\s+/g, '-');
            
            newHTML += `
                <div class="recipe-card">
                    <div class="recipe-info">
                        <h4>${recipe.Menu_Name}</h4>
                        <p>${recipe.Menu_Description || "Resep standar program MBG."}</p>
                    </div>
                    <div class="recipe-actions">
                        <span class="status-badge ${statusClass}">${currentStatus}</span>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="secondary-btn" onclick="openViewModal('${recipe.MenuID}')" style="padding: 5px 10px; font-size: 0.8rem;">View</button>
                            <button class="edit-btn" onclick="window.location.href='edit_menu.html?id=${recipe.MenuID}'">Edit</button>
                            <button class="icon-btn" onclick="handleDelete('${recipe.MenuID}')">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Ganti isi konten sekaligus untuk meminimalisir kedipan
    menuList.innerHTML = newHTML;
}

async function openViewModal(menuID) {
    const modal = document.getElementById('viewModal');
    modal.style.display = "block";
    
    // Reset konten
    document.getElementById('viewMenuName').innerText = "Memuat...";
    document.getElementById('viewIngredientsList').innerHTML = "";
    document.getElementById('viewProceduresList').innerHTML = "";

    try {
        // 1. Ambil Data Menu Utama
        const menuRes = await fetch(`${scriptURL}?action=readAll&targetSheet=Menu%20Databases`);
        const menus = await menuRes.json();
        const menu = menus.find(m => m.MenuID === menuID);

        // 2. Ambil Data Bahan
        const ingRes = await fetch(`${scriptURL}?action=readAll&targetSheet=Menu%20Ingredients`);
        const allIng = await ingRes.json();
        const ingredients = allIng.filter(i => i.MenuID === menuID);

        // 3. Ambil Data Prosedur
        const procRes = await fetch(`${scriptURL}?action=readAll&targetSheet=Menu%20Procedure`);
        const allProc = await procRes.json();
        const procedures = allProc.filter(p => p.menuID === menuID);

        // Isi data ke UI
        document.getElementById('viewMenuName').innerText = menu.Menu_Name;
        document.getElementById('viewMenuDesc').innerText = menu.Menu_Description || "-";
        
        const imgContainer = document.getElementById('viewMenuImageContainer');
        imgContainer.innerHTML = menu.Menu_Image ? `<img src="${menu.Menu_Image}" class="view-img">` : "";

        document.getElementById('viewIngredientsList').innerHTML = ingredients
            .map(i => `<li>${i.Ingredient_Name} - ${i.Ingredient_Quantity} ${i.URT}</li>`).join('');

        document.getElementById('viewProceduresList').innerHTML = procedures
            .map(p => `<li>${p.procedure}</li>`).join('');

    } catch (err) {
        console.error(err);
        Swal.fire("Error", "Gagal memuat detail resep", "error");
    }
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = "none";
}

// Tutup modal jika klik di luar kotak modal
window.onclick = function(event) {
    const modal = document.getElementById('viewModal');
    if (event.target == modal) {
        closeViewModal();
    }
}

// 6. DELETE RECIPE (Using Session UserID for Logging)
function handleDelete(menuID) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Resep yang dihapus tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${scriptURL}?action=deleteMenu&id=${menuID}&userId=${userID}`)
                .then(res => res.text())
                .then(response => {
                    Swal.fire('Dihapus!', response, 'success');
                    fetchUserRecipes();
                });
        }
    });
}

// 7. LOGOUT (Clearing Session)
function handleLogout() {
    if (!confirm("Logout from Ekosistem MBG?")) return;

    // Log the event before clearing data
    fetch(`${scriptURL}?action=logOnly&userId=${userID}&name=${userName}&event=Logout&details=User logged out manually`)
        .finally(() => {
            // Crucial: Wipe the session completely
            sessionStorage.clear();
            window.location.href = "index.html";
        });
}
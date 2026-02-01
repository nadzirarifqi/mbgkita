const scriptURL = 'https://script.google.com/macros/s/AKfycby8NKHfxf8D8DpIP9DIXIktHL2cbi_Jz1sS4j_UqdKyBbvWsD2ksmlgmUhce_AiuwsCdw/exec';

let dbIngredients = [];
let dbUrts = [];

// 1. AMBIL DATA KONSTANTA (BAHAN & URT)
async function fetchConstants() {
    try {
        const response = await fetch(`${scriptURL}?action=getConstants`);
        const data = await response.json();
        
        dbIngredients = data.ingredients || [];
        dbUrts = data.urts || [];
        
        const ingList = document.getElementById('common-ingredients');
        if (ingList) {
            ingList.innerHTML = dbIngredients.map(ing => `<option value="${ing.name}">`).join('');
        }

        const urtList = document.getElementById('common-urts');
        if (urtList) {
            urtList.innerHTML = dbUrts.map(u => `<option value="${u.name}">`).join('');
        }
    } catch (err) {
        console.error("Gagal memuat rekomendasi:", err);
    }
}

// 2. TAMBAH BARIS BAHAN
function addIngredientRow() {
    const container = document.getElementById('ingredientContainer');
    if (!container) return;
    const id = Date.now();
    
    const html = `
        <div class="dynamic-row" id="ing-${id}" style="margin-bottom: 15px;">
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="ing-name" placeholder="Nama Bahan" 
                       list="common-ingredients" onchange="fetchNutritionInfo(this)" required style="flex: 3;">
                
                <input type="number" class="ing-qty" placeholder="Qty" step="any" required style="flex: 1;">
                
                <input type="text" class="ing-urt" placeholder="Satuan" 
                       list="common-urts" required style="flex: 1.5;">
                
                <button type="button" class="delete-row-btn" onclick="removeRow('ing-${id}')">×</button>
            </div>
            <div class="nutrition-display" style="font-size: 0.75rem; color: #166534; margin-top: 4px; min-height: 1em;"></div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

// 3. FUNGSI FETCH GIZI (FatSecret melalui Apps Script)
async function fetchNutritionInfo(inputElement) {
    const query = inputElement.value.trim();
    const displayDiv = inputElement.closest('.dynamic-row').querySelector('.nutrition-display');
    
    console.log("Mencari gizi untuk:", query); 

    if (query.length < 3) {
        displayDiv.innerText = "";
        return;
    }

    displayDiv.innerText = "🔍 Mencari info gizi...";
    displayDiv.style.color = "#64748b";

    try {
        // PERBAIKAN: fetch dulu, baru definisikan data
        const response = await fetch(`${scriptURL}?action=getNutrition&query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        console.log("Data dari API:", data); 

        if (data.food) {
            // Sesuai perbaikan di Apps Script semalam, kita ambil serving pertama
            const s = data.food.servings.serving;
            const serving = Array.isArray(s) ? s[0] : s;
            
            displayDiv.innerHTML = `
                <b>Estimasi (${serving.serving_description}):</b> 
                🔥 ${serving.calories} kcal | 
                🍞 K: ${serving.carbohydrate}g | 
                🥩 P: ${serving.protein}g | 
                🥑 L: ${serving.fat}g
            `;
            displayDiv.style.color = "#166534";
        } else {
            displayDiv.innerText = "⚠️ Info gizi tidak ditemukan.";
            displayDiv.style.color = "#ef4444";
        }
    } catch (err) {
        console.error("FatSecret Error:", err);
        displayDiv.innerText = "❌ Gagal terhubung ke API Gizi.";
    }
}

// 4. TAMBAH LANGKAH MASAK
function addStepRow() {
    const container = document.getElementById('stepContainer');
    if (!container) return;
    const id = Date.now();
    const html = `
        <div class="dynamic-row step-entry" id="step-${id}">
            <span class="step-num"></span>
            <input type="text" class="step-text" placeholder="Jelaskan langkah memasak..." required>
            <button type="button" class="delete-row-btn" onclick="removeRow('step-${id}')">×</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    renumberSteps();
}

function removeRow(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    renumberSteps();
}

function renumberSteps() {
    document.querySelectorAll('.step-num').forEach((el, i) => el.innerText = (i + 1) + ".");
}

// 5. INITIALIZATION
async function init() {
    await fetchConstants(); 
    const container = document.getElementById('ingredientContainer');
    // Hanya tambah baris otomatis jika ini halaman "Add Menu" (kontainer kosong)
    if (container && container.children.length === 0) {
        addIngredientRow();
        addStepRow();
    }
}

init();

// 6. SUBMIT HANDLER
document.getElementById('recipeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Menyimpan Resep...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }

    const ingredients = [];
    document.querySelectorAll('#ingredientContainer .dynamic-row').forEach(row => {
        ingredients.push({
            name: row.querySelector('.ing-name').value,
            qty: row.querySelector('.ing-qty').value,
            unit: row.querySelector('.ing-urt').value
        });
    });

    const steps = [];
    document.querySelectorAll('.step-text').forEach(input => {
        if (input.value.trim() !== "") steps.push(input.value);
    });

    const payload = {
        userID: sessionStorage.getItem('userID'),
        menuName: document.getElementById('menuName').value,
        menuDesc: document.getElementById('menuDesc').value,
        menuImage: document.getElementById('menuImage').value,
        menuVideo: document.getElementById('menuVideo').value,
        ingredients: JSON.stringify(ingredients),
        procedure: JSON.stringify(steps)
    };

    fetch(`${scriptURL}?action=addMenu`, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(res => res.text())
    .then(msg => {
        const isSuccess = msg.toLowerCase().includes("success");
        if (typeof Swal !== 'undefined') {
            Swal.fire(isSuccess ? 'Berhasil!' : 'Info', msg, isSuccess ? 'success' : 'info')
                .then(() => { if(isSuccess) window.location.href = "developer_dashboard.html"; });
        } else {
            alert(msg);
            if(isSuccess) window.location.href = "developer_dashboard.html";
        }
    })
    .catch(err => {
        console.error(err);
        if (typeof Swal !== 'undefined') Swal.fire('Error', 'Gagal mengirim data.', 'error');
    });
});
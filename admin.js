document.addEventListener('DOMContentLoaded', function() {
    // --- GANTI URL INI DENGAN URL WEB APP ANDA DARI GOOGLE APPS SCRIPT ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZp1EuMRgPKXIToxvY5CaRAKa9jSc1t3A7s8sIAZS0UGE-Ak-hx7A57whhBGuMYRl4Uw/exec';
    // -------------------------------------------------------------------

    // --- GANTI USERNAME & PASSWORD LANGSUNG DI SINI ---
    const ADMIN_USERNAME_JS = "admin";
    const ADMIN_PASSWORD_JS = "admin1";
    // --------------------------------------------------

    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const productsTableBody = document.getElementById('products-table-body');
    const ordersTableBody = document.getElementById('orders-table-body');
    const addProductForm = document.getElementById('add-product-form');
    const loader = document.getElementById('loader');

    const showLoader = (show) => loader.classList.toggle('hidden', !show);

    const handleLogin = (e) => {
        e.preventDefault();
        const usernameInput = loginForm.username.value;
        const passwordInput = loginForm.password.value;
        if (usernameInput === ADMIN_USERNAME_JS && passwordInput === ADMIN_PASSWORD_JS) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            showDashboard();
        } else {
            alert("Username atau Password salah.");
        }
    };

    const showDashboard = () => {
        loginSection.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        loadProducts();
        loadOrders();
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        loginSection.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    };

    const loadProducts = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getProducts`);
            const result = await response.json();
            if (result.success) renderProducts(result.data);
            else alert('Gagal memuat produk.');
        } catch (error) {
            alert('Terjadi kesalahan saat memuat produk.');
        } finally {
            showLoader(false);
        }
    };
    
    const renderProducts = (products) => {
        productsTableBody.innerHTML = '';
        if (products.length === 0) {
            productsTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-4">Belum ada produk.</td></tr>`;
            return;
        }
        products.forEach(p => {
            productsTableBody.innerHTML += `
                <tr class="border-b" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-stock="${p.stock}" data-image="${p.imageUrl}">
                    <td class="p-2 align-top"><img src="${p.imageUrl}" alt="${p.name}" class="w-16 h-16 object-cover rounded"></td>
                    <td class="p-2 align-top font-medium">${p.name}</td>
                    <td class="p-2 align-top">Rp ${Number(p.price).toLocaleString('id-ID')}</td>
                    <td class="p-2 align-top">${p.stock}</td>
                    <td class="p-2 align-top text-center">
                        <button class="update-btn bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Update</button>
                        <button class="delete-btn bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 ml-1">Hapus</button>
                    </td>
                </tr>
            `;
        });
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        showLoader(true);
        const payload = {
            name: document.getElementById('product-name').value,
            price: Number(document.getElementById('product-price').value),
            stock: Number(document.getElementById('product-stock').value),
            imageUrl: document.getElementById('product-image').value,
        };
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'addProduct', payload }),
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                addProductForm.reset();
                loadProducts();
            }
        } catch (error) {
            alert('Gagal menambah produk.');
        } finally {
            showLoader(false);
        }
    };
    
    /**
     * FUNGSI BARU UNTUK MENGHANDLE SEMUA AKSI (UPDATE INLINE & DELETE)
     */
    const handleProductActions = async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;

        const id = row.dataset.id;

        // --- AKSI HAPUS ---
        if (target.classList.contains('delete-btn')) {
            if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                showLoader(true);
                try {
                    const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'deleteProduct', payload: { id } }) });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) loadProducts();
                } catch (error) { alert('Gagal menghapus produk.'); } finally { showLoader(false); }
            }
        }

        // --- AKSI UPDATE (MENGUBAH BARIS MENJADI FORM) ---
        if (target.classList.contains('update-btn')) {
            const currentData = row.dataset;
            row.innerHTML = `
                <td class="p-2 align-top"><input type="text" class="edit-image w-full border rounded p-1" value="${currentData.image}"></td>
                <td class="p-2 align-top"><input type="text" class="edit-name w-full border rounded p-1" value="${currentData.name}"></td>
                <td class="p-2 align-top"><input type="number" class="edit-price w-24 border rounded p-1" value="${currentData.price}"></td>
                <td class="p-2 align-top"><input type="number" class="edit-stock w-20 border rounded p-1" value="${currentData.stock}"></td>
                <td class="p-2 align-top text-center">
                    <button class="save-btn bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Simpan</button>
                    <button class="cancel-btn bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 mt-1">Batal</button>
                </td>
            `;
        }

        // --- AKSI SIMPAN (MENGIRIM DATA BARU) ---
        if (target.classList.contains('save-btn')) {
            showLoader(true);
            const payload = {
                id: id,
                imageUrl: row.querySelector('.edit-image').value,
                name: row.querySelector('.edit-name').value,
                price: Number(row.querySelector('.edit-price').value),
                stock: Number(row.querySelector('.edit-stock').value),
            };
            try {
                const response = await fetch(SCRIPT_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ action: 'updateProduct', payload }) });
                const result = await response.json();
                alert(result.message);
            } catch (error) {
                alert('Gagal mengupdate produk.');
            } finally {
                loadProducts(); // Muat ulang tabel untuk kembali ke mode normal
            }
        }

        // --- AKSI BATAL ---
        if (target.classList.contains('cancel-btn')) {
            loadProducts(); // Cukup muat ulang tabel untuk membatalkan
        }
    };

    const loadOrders = async () => {
        // ...fungsi ini tetap sama...
    };

    const renderOrders = (orders) => {
        // ...fungsi ini tetap sama...
    };

    const handleUpdateStatus = async (e) => {
        // ...fungsi ini tetap sama...
    };

    // EVENT LISTENERS
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    addProductForm.addEventListener('submit', handleAddProduct);
    productsTableBody.addEventListener('click', handleProductActions);
    ordersTableBody.addEventListener('change', handleUpdateStatus);

    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        showDashboard();
    }
});
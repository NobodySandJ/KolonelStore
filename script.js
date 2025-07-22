document.addEventListener('DOMContentLoaded', () => {
    // --- GANTI DENGAN URL WEB APP GOOGLE SCRIPT ANDA YANG BENAR ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZp1EuMRgPKXIToxvY5CaRAKa9jSc1t3A7s8sIAZS0UGE-Ak-hx7A57whhBGuMYRl4Uw/exec'; 
    // -----------------------------------------------------------

    // === ELEMEN DOM ===
    const productListContainer = document.getElementById('product-list');
    const loader = document.createElement('div');
    loader.className = 'text-center col-span-full text-slate-400';
    loader.textContent = 'Memuat produk...';
    
    // Elemen Keranjang
    const openCartBtn = document.getElementById('open-cart-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const cartTotalEl = document.getElementById('cart-total');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const checkoutBtn = document.getElementById('checkout-button');

    // Elemen Modal & Notifikasi
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutModalBtn = document.getElementById('close-checkout-modal-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const thankyouModal = document.getElementById('thankyou-modal');
    const closeThankyouModalBtn = document.getElementById('close-thankyou-modal-btn');
    const notificationContainer = document.getElementById('notification-container');

    // === STATE ===
    let cart = JSON.parse(localStorage.getItem('kolonel-cart')) || []; 

    // === FUNGSI-FUNGSI ===
    
    const loadProducts = async () => {
        if (!SCRIPT_URL || SCRIPT_URL === 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DI_SINI') {
            productListContainer.innerHTML = '<p class="text-center col-span-full text-yellow-400">PENTING: URL Google Apps Script belum dimasukkan di file script.js.</p>';
            return;
        }
        productListContainer.innerHTML = ''; 
        productListContainer.appendChild(loader);
        try {
            const response = await fetch(`${SCRIPT_URL}?action=getProducts`);
            const result = await response.json();
            productListContainer.innerHTML = '';
            if (result.success && result.data.length > 0) {
                result.data.forEach(product => {
                    if (product.stock > 0) {
                        const productCard = document.createElement('div');
                        productCard.className = 'bg-slate-800 rounded-lg overflow-hidden group relative transition-all duration-300 hover:scale-105 hover:ring-2 ring-indigo-500';
                        productCard.innerHTML = `
                            <div class="w-full h-64 bg-slate-700">
                                <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-full object-cover">
                            </div>
                            <div class="p-4 text-center">
                                <h3 class="font-semibold text-lg text-white truncate">${product.name}</h3>
                                <p class="text-slate-400 mb-4">Rp ${Number(product.price).toLocaleString('id-ID')}</p>
                            </div>
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button class="add-to-cart-btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2" 
                                        data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-image="${product.imageUrl}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>
                                    <span>Tambah</span>
                                </button>
                            </div>
                        `;
                        productListContainer.appendChild(productCard);
                    }
                });
            } else {
                productListContainer.innerHTML = '<p class="text-center col-span-full text-slate-400">Belum ada produk yang tersedia.</p>';
            }
        } catch (error) {
            productListContainer.innerHTML = '<p class="text-center col-span-full text-red-400">Gagal memuat produk. Coba refresh halaman.</p>';
        }
    };
    
    const showNotification = (message) => {
        const notif = document.createElement('div');
        notif.className = 'bg-indigo-600 text-white py-2 px-5 rounded-lg shadow-lg transform translate-y-10 opacity-0 transition-all duration-300';
        notif.textContent = message;
        notificationContainer.appendChild(notif);
        setTimeout(() => {
            notif.classList.remove('translate-y-10', 'opacity-0');
        }, 10);
        setTimeout(() => {
            notif.classList.add('translate-y-10', 'opacity-0');
            notif.addEventListener('transitionend', () => notif.remove());
        }, 3000);
    };

    const openCart = () => { cartSidebar.classList.remove('translate-x-full'); cartOverlay.classList.remove('hidden'); };
    const closeCart = () => { cartSidebar.classList.add('translate-x-full'); cartOverlay.classList.add('hidden'); };

    const addToCart = (id, name, price, image) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) existingItem.quantity++;
        else cart.push({ id, name, price: Number(price), image, quantity: 1 });
        showNotification(`${name} ditambahkan!`);
        updateCart();
    };
    
    const updateCartQuantity = (id, newQuantity) => {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            if (newQuantity > 0) cart[itemIndex].quantity = newQuantity;
            else cart.splice(itemIndex, 1);
        }
        updateCart();
    };
    
    const updateCart = () => {
        renderCartItems();
        localStorage.setItem('kolonel-cart', JSON.stringify(cart));
    };

    const renderCartItems = () => {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) { 
            cartItemsContainer.appendChild(cartEmptyMsg);
            cartEmptyMsg.classList.remove('hidden');
            checkoutBtn.disabled = true;
        } else {
            cartEmptyMsg.classList.add('hidden');
            checkoutBtn.disabled = false;
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'flex items-center space-x-4 py-3 border-b border-slate-700';
                itemEl.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-md object-cover">
                    <div class="flex-grow">
                        <p class="font-semibold text-white text-sm">${item.name}</p>
                        <p class="text-slate-400 text-sm">Rp ${item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="flex items-center">
                            <button class="quantity-change p-1 text-slate-400 hover:text-white" data-id="${item.id}" data-change="-1">-</button>
                            <span class="w-8 text-center font-semibold text-white">${item.quantity}</span>
                            <button class="quantity-change p-1 text-slate-400 hover:text-white" data-id="${item.id}" data-change="1">+</button>
                        </div>
                         <button class="remove-item text-xs text-red-400 hover:text-red-300 mt-1" data-id="${item.id}">Hapus</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalEl.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (itemCount > 0) {
            cartCountBadge.textContent = itemCount;
            cartCountBadge.classList.remove('hidden');
        } else {
            cartCountBadge.classList.add('hidden');
        }
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Memproses...';
        const orderPayload = {
            customer: {
                name: document.getElementById('customer-name').value,
                whatsapp: document.getElementById('customer-whatsapp').value,
                email: document.getElementById('customer-email').value,
                address: document.getElementById('customer-address').value,
            },
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };

        fetch(SCRIPT_URL, { 
            method: 'POST', 
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addNewOrder', payload: orderPayload }) 
        })
        .then(() => {
            cart = [];
            updateCart();
            checkoutModal.classList.add('hidden');
            checkoutForm.reset();
            thankyouModal.classList.remove('hidden');
            loadProducts();
        })
        .catch(error => {
            alert('Terjadi kesalahan jaringan. Silakan coba lagi.');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Konfirmasi Pesanan';
        });
    };

    // EVENT LISTENERS
    openCartBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    checkoutBtn.addEventListener('click', () => {
        if (!checkoutBtn.disabled) checkoutModal.classList.remove('hidden');
    });
    closeCheckoutModalBtn.addEventListener('click', () => checkoutModal.classList.add('hidden'));
    checkoutForm.addEventListener('submit', handleCheckout);
    closeThankyouModalBtn.addEventListener('click', () => thankyouModal.classList.add('hidden'));
    
    productListContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart-btn');
        if (button) {
            addToCart(button.dataset.id, button.dataset.name, button.dataset.price, button.dataset.image);
        }
    });

    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (target.classList.contains('quantity-change')) {
            const change = parseInt(target.dataset.change);
            const item = cart.find(i => i.id === id);
            if (item) {
                const newQuantity = item.quantity + change;
                updateCartQuantity(id, newQuantity);
            }
        }
        if (target.classList.contains('remove-item')) {
            updateCartQuantity(id, 0);
        }
    });

    // Login Tersembunyi
    const logoElement = document.querySelector('header a');
    let clickCount = 0;
    let clickTimer = null;
    if(logoElement) {
        logoElement.addEventListener('click', (e) => {
            e.preventDefault(); 
            clickCount++;
            if (clickTimer) clearTimeout(clickTimer);
            clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
            if (clickCount === 5) {
                window.location.href = 'admin.html';
            }
        });
    }

    // INISIALISASI
    loadProducts(); 
    updateCart();
});
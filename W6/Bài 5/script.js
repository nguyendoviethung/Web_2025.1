// --- Khởi tạo ---
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const addProductBtn = document.getElementById('addProductBtn');
const addProductForm = document.getElementById('addProductForm');
const cancelBtn = document.getElementById('cancelBtn');
const productList = document.querySelector('.product-list');

// ======== HÀM XỬ LÝ LOCAL STORAGE =========

// Lấy danh sách sản phẩm từ localStorage
function getProducts() {
    const stored = localStorage.getItem('products');
    return stored ? JSON.parse(stored) : [];
}

// Lưu danh sách sản phẩm vào localStorage
function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// Hiển thị danh sách sản phẩm ra giao diện
function renderProducts(products) {
    productList.innerHTML = ''; // Xóa nội dung cũ
    products.forEach(p => {
        const item = document.createElement('article');
        item.className = 'product-item';
        item.innerHTML = `
            <h3 class="product-name">${p.name}</h3>
            <p>${p.desc}</p>
            <p>Giá: ${p.price}</p>
        `;
        productList.appendChild(item);
    });
}

// ======== KHỞI TẠO DỮ LIỆU MẪU =========
const defaultProducts = [
    { name: 'Đắc Nhân Tâm', desc: 'Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử của Dale Carnegie.', price: '85.000đ' },
    { name: 'Nhà Giả Kim', desc: 'Tác phẩm nổi tiếng của Paulo Coelho về hành trình tìm kiếm ước mơ.', price: '79.000đ' },
    { name: 'Sapiens', desc: 'Lược sử loài người của Yuval Noah Harari - cuốn sách bán chạy toàn cầu.', price: '189.000đ' }
];

// Nếu chưa có dữ liệu trong localStorage thì khởi tạo
if (!localStorage.getItem('products')) {
    saveProducts(defaultProducts);
}

// Hiển thị danh sách ban đầu
renderProducts(getProducts());


// ======== CHỨC NĂNG TÌM KIẾM =========
searchBtn.addEventListener('click', function() {
    const keyword = searchInput.value.toLowerCase().trim();
    const products = getProducts();
    const filtered = products.filter(p => p.name.toLowerCase().includes(keyword));

    renderProducts(filtered);

    if (filtered.length === 0 && keyword !== '') {
        alert(`Không tìm thấy sản phẩm nào với từ khóa "${keyword}"`);
    }
});

// Cho phép tìm kiếm bằng Enter
searchInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') searchBtn.click();
});


// ======== FORM THÊM SẢN PHẨM =========
addProductBtn.addEventListener('click', function() {
    addProductForm.classList.toggle('hidden');
    addProductForm.style.display = addProductForm.classList.contains('hidden') ? 'none' : 'block';
});

// Nút Hủy
cancelBtn.addEventListener('click', function() {
    addProductForm.reset();
    addProductForm.classList.add('hidden');
    addProductForm.style.display = 'none';
});

// Xử lý khi submit form
addProductForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const desc = document.getElementById('productDesc').value.trim();
    const price = document.getElementById('productPrice').value.trim();

    if (!name || !desc || !price) {
        alert('Vui lòng nhập đầy đủ thông tin sản phẩm!');
        return;
    }

    const newProduct = { name, desc, price };

    // Lấy danh sách hiện tại, thêm mới, lưu lại
    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);

    // Cập nhật lại giao diện
    renderProducts(products);

    // Reset và ẩn form
    addProductForm.reset();
    addProductForm.classList.add('hidden');
    addProductForm.style.display = 'none';

    alert(`Đã thêm sản phẩm "${name}" thành công!`);
});

// ======== GHI LOG =========
console.log('✅ JavaScript và LocalStorage hoạt động ổn định!');

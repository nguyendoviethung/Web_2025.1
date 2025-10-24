// Chức năng tìm kiếm sản phẩm
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Xử lý sự kiện tìm kiếm
searchBtn.addEventListener('click', function() {
    const keyword = searchInput.value.toLowerCase().trim();
    
    // Lấy tất cả sản phẩm
    const products = document.querySelectorAll('.product-item');
    
    // Duyệt qua từng sản phẩm
    products.forEach(function(product) {
        const productName = product.querySelector('.product-name').textContent.toLowerCase();
        
        // Kiểm tra xem tên có chứa từ khóa không
        if (keyword === '') {
            // Nếu ô tìm kiếm trống, hiển thị tất cả
            product.style.display = '';
        } else if (productName.includes(keyword)) {
            // Nếu có chứa từ khóa, hiển thị
            product.style.display = '';
        } else {
            // Nếu không chứa, ẩn đi
            product.style.display = 'none';
        }
    });
    
    // Kiểm tra nếu không tìm thấy sản phẩm nào
    const visibleProducts = document.querySelectorAll('.product-item[style=""]');
    if (visibleProducts.length === 0 && keyword !== '') {
        alert('Không tìm thấy sản phẩm nào với từ khóa "' + keyword + '"');
    }
});

// Cho phép tìm kiếm khi nhấn Enter
searchInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        searchBtn.click();
    }
});

// Chức năng hiển thị form "Thêm sản phẩm"
const addProductBtn = document.getElementById('addProductBtn');
const addProductForm = document.getElementById('addProductForm');
const cancelBtn = document.getElementById('cancelBtn');

// Xử lý sự kiện click nút "Thêm sản phẩm"
addProductBtn.addEventListener('click', function() {
    // Toggle hiển thị form
    if (addProductForm.style.display === 'none' || addProductForm.classList.contains('hidden')) {
        addProductForm.style.display = 'block';
        addProductForm.classList.remove('hidden');
    } else {
        addProductForm.style.display = 'none';
        addProductForm.classList.add('hidden');
    }
});

// Xử lý nút Hủy
cancelBtn.addEventListener('click', function() {
    addProductForm.style.display = 'none';
    addProductForm.classList.add('hidden');
    addProductForm.reset(); // Reset form
});

// Xử lý submit form thêm sản phẩm
addProductForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Ngăn form reload trang
    
    // Lấy giá trị từ form
    const name = document.getElementById('productName').value;
    const desc = document.getElementById('productDesc').value;
    const price = document.getElementById('productPrice').value;
    
    // Kiểm tra nếu form đang ẩn thì hiện lên
    if (addProductForm.style.display === 'none') {
        addProductForm.style.display = 'block';
    }
    
    // Tạo sản phẩm mới
    const productList = document.querySelector('.product-list');
    const newProduct = document.createElement('article');
    newProduct.className = 'product-item';
    
    newProduct.innerHTML = `
        <h3 class="product-name">${name}</h3>
        <p>${desc}</p>
        <p>Giá: ${price}</p>
    `;
    
    // Thêm sản phẩm vào danh sách
    productList.appendChild(newProduct);
    
    // Reset form và ẩn đi
    addProductForm.reset();
    addProductForm.style.display = 'none';
    addProductForm.classList.add('hidden');
    
    alert('Đã thêm sản phẩm "' + name + '" thành công!');
});

// Thử nhập các từ khóa khác nhau vào ô tìm kiếm và nhấn "Tìm"
console.log('JavaScript đã được tải thành công!');
console.log('Thử tìm kiếm "Sách A" để xem danh sách sản phẩm được lọc');
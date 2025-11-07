import React, { useState, useEffect } from 'react';


// Component chính quản lý toàn bộ state và điều phối các component con
export default function App() {
  // State lưu từ khóa tìm kiếm
  const [kw, setKeyword] = useState("");
  
  // State lưu thông tin người dùng mới cần thêm vào
  const [newUser, setNewUser] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
           Quản lý Người dùng
        </h1>
        
        {/* Component tìm kiếm - truyền hàm setKeyword xuống */}
        <SearchForm onChangeValue={setKeyword} />
        
        {/* Component thêm người dùng - truyền hàm setNewUser xuống */}
        <AddUser onAdd={setNewUser} />
        
        {/* Component hiển thị bảng - truyền keyword và newUser xuống */}
        <ResultTable 
          keyword={kw} 
          user={newUser} 
          onAdded={() => setNewUser(null)} 
        />
      </div>
    </div>
  );
}

// ==================== COMPONENT SEARCHFORM ====================
// Component cho phép người dùng nhập từ khóa tìm kiếm
function SearchForm({ onChangeValue }) {
  return (
    <div className="mb-5">
      <input
        type="text"
        placeholder="🔍 Tìm kiếm theo tên hoặc username..."
        className="w-full px-5 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
        // Mỗi khi người dùng nhập, gọi hàm onChangeValue (tức setKeyword từ App)
        onChange={(e) => onChangeValue(e.target.value)}
      />
    </div>
  );
}

// ==================== COMPONENT ADDUSER ====================
// Component hiển thị form thêm người dùng mới
function AddUser({ onAdd }) {
  // State kiểm soát việc hiển thị form (true = hiện, false = ẩn)
  const [adding, setAdding] = useState(false);
  
  // State lưu thông tin người dùng đang nhập
  const [user, setUser] = useState({
    name: "",
    username: "",
    email: "",
    address: {
      street: "",
      suite: "",
      city: ""
    },
    phone: "",
    website: ""
  });

  // Hàm xử lý khi người dùng thay đổi giá trị trong form
  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Nếu đang sửa các trường thuộc address (lồng nhau)
    if (["street", "suite", "city"].includes(id)) {
      // Phải dùng spread operator (...) để sao chép cả user và address
      // Tránh mất dữ liệu và đảm bảo React nhận ra sự thay đổi
      setUser({
        ...user,
        address: {
          ...user.address,
          [id]: value
        }
      });
    } else {
      // Với các trường thông thường, chỉ cần spread user
      setUser({
        ...user,
        [id]: value
      });
    }
  };

  // Hàm xử lý khi nhấn nút "Lưu"
  const handleAdd = () => {
    // Validate: Kiểm tra các trường bắt buộc
    if (user.name === "" || user.username === "") {
      alert("⚠️ Vui lòng nhập Name và Username!");
      return;
    }
    
    // Gọi hàm onAdd (tức setNewUser từ App) để truyền dữ liệu lên component cha
    onAdd(user);
    
    // Reset form về trạng thái ban đầu
    setUser({
      name: "",
      username: "",
      email: "",
      address: { street: "", suite: "", city: "" },
      phone: "",
      website: ""
    });
    
    // Đóng form
    setAdding(false);
  };

  return (
    <div className="mb-5">
      {/* Nút mở form thêm người dùng */}
      <button 
        className="bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 hover:-translate-y-0.5 hover:shadow-lg transition-all"
        onClick={() => setAdding(true)}
      >
         Thêm người dùng mới
      </button>

      {/* Modal hiển thị khi adding = true */}
      {adding && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setAdding(false)}
        >
          {/* stopPropagation để click vào content không đóng modal */}
          <div 
            className="bg-white rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-2xl font-bold mb-5 text-gray-800">
               Thêm người dùng mới
            </h4>
            
            {/* Form nhập liệu */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block mb-1 text-gray-700 font-medium">
                  Tên đầy đủ *
                </label>
                <input
                  id="name"
                  type="text"
                  value={user.name}
                  onChange={handleChange}
                  placeholder="Nhập tên đầy đủ"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="username" className="block mb-1 text-gray-700 font-medium">
                  Username *
                </label>
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  onChange={handleChange}
                  placeholder="Nhập username"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-1 text-gray-700 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="street" className="block mb-1 text-gray-700 font-medium">
                  Địa chỉ
                </label>
                <input
                  id="street"
                  type="text"
                  value={user.address.street}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="suite" className="block mb-1 text-gray-700 font-medium">
                  Phường/Xã
                </label>
                <input
                  id="suite"
                  type="text"
                  value={user.address.suite}
                  onChange={handleChange}
                  placeholder="Phường, xã"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="city" className="block mb-1 text-gray-700 font-medium">
                  Thành phố
                </label>
                <input
                  id="city"
                  type="text"
                  value={user.address.city}
                  onChange={handleChange}
                  placeholder="Thành phố"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block mb-1 text-gray-700 font-medium">
                  Số điện thoại
                </label>
                <input
                  id="phone"
                  type="text"
                  value={user.phone}
                  onChange={handleChange}
                  placeholder="Số điện thoại"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="website" className="block mb-1 text-gray-700 font-medium">
                  Website
                </label>
                <input
                  id="website"
                  type="text"
                  value={user.website}
                  onChange={handleChange}
                  placeholder="Website"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-all"
                onClick={handleAdd}
              >
                 Lưu
              </button>
              <button 
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
                onClick={() => setAdding(false)}
              >
                 Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENT RESULTTABLE ====================
// Component hiển thị danh sách người dùng và xử lý CRUD
function ResultTable({ keyword, user, onAdded }) {
  // State lưu danh sách người dùng
  const [users, setUsers] = useState([]);
  
  // State theo dõi trạng thái loading
  const [loading, setLoading] = useState(true);
  
  // State lưu thông tin người dùng đang được chỉnh sửa
  const [editing, setEditing] = useState(null);

  // useEffect: Tải dữ liệu từ API khi component được mount lần đầu
  // Dependency array [] có nghĩa là chỉ chạy 1 lần duy nhất
  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi khi tải dữ liệu:", error);
        setLoading(false);
      });
  }, []);

  // useEffect: Lắng nghe khi có người dùng mới từ AddUser component
  // Khi prop 'user' thay đổi, thêm người dùng mới vào danh sách
  useEffect(() => {
    if (user) {
      // Thêm người dùng mới vào đầu danh sách
      // prev.length + 1 để tạo id mới (trong thực tế API sẽ tự tạo)
      setUsers((prev) => [
        { ...user, id: prev.length + 1 },
        ...prev
      ]);
      
      // Gọi onAdded() để reset state newUser ở App về null
      onAdded();
    }
  }, [user, onAdded]);

  // Hàm lọc danh sách theo từ khóa tìm kiếm
  // Tìm trong cả name và username, không phân biệt chữ hoa/thường
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(keyword.toLowerCase()) ||
    u.username.toLowerCase().includes(keyword.toLowerCase())
  );

  // Hàm kích hoạt chế độ chỉnh sửa
  function editUser(user) {
    // QUAN TRỌNG: Phải deep copy để tránh thay đổi dữ liệu gốc
    // Vì object trong JS là tham chiếu, không copy sẽ làm thay đổi dữ liệu trong bảng
    setEditing({
      ...user,
      address: { ...user.address }
    });
  }

  // Hàm xử lý thay đổi trong form chỉnh sửa
  function handleEditChange(field, value) {
    // Nếu field thuộc address
    if (["street", "suite", "city"].includes(field)) {
      setEditing({
        ...editing,
        address: {
          ...editing.address,
          [field]: value
        }
      });
    } else {
      setEditing({
        ...editing,
        [field]: value
      });
    }
  }

  // Hàm lưu thông tin đã chỉnh sửa
  function saveUser() {
    // Validate
    if (editing.name === "" || editing.username === "") {
      alert("⚠️ Vui lòng nhập Name và Username!");
      return;
    }
    
    // Cập nhật danh sách: dùng map() để tìm và thay thế user có id tương ứng
    setUsers(prev => 
      prev.map(u => u.id === editing.id ? editing : u)
    );
    
    // Đóng form chỉnh sửa
    setEditing(null);
  }

  // Hàm xóa người dùng
  function removeUser(id) {
    // Xác nhận trước khi xóa
    if (window.confirm("🗑️ Bạn có chắc muốn xóa người dùng này?")) {
      // Dùng filter() để giữ lại tất cả người dùng KHÁC với id cần xóa
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  // Hiển thị loading trong khi tải dữ liệu
  if (loading) {
    return (
      <div className="text-center py-10 text-purple-600 text-lg">
         Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="mt-5">
      {/* Hiển thị thông tin kết quả tìm kiếm */}
      {keyword && (
        <p className="mb-3 text-purple-600">
           Tìm thấy <strong>{filteredUsers.length}</strong> kết quả cho "<strong>{keyword}</strong>"
        </p>
      )}

      {/* Bảng hiển thị dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-purple-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Thành phố</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              // Dùng map() để render từng người dùng thành 1 hàng
              filteredUsers.map((u) => (
                <tr key={u.id} className="border-b hover:bg-purple-50 transition-colors">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.address.city}</td>
                  <td className="px-4 py-3">
                    <button 
                      className="bg-green-500 text-white px-4 py-2 rounded-md mr-2 hover:bg-green-600 hover:-translate-y-0.5 transition-all text-sm"
                      onClick={() => editUser(u)}
                    >
                       Sửa
                    </button>
                    <button 
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 hover:-translate-y-0.5 transition-all text-sm"
                      onClick={() => removeUser(u.id)}
                    >
                       Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Hiển thị thông báo khi không có dữ liệu
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500 italic">
                  {keyword 
                    ? " Không tìm thấy kết quả phù hợp" 
                    : " Chưa có dữ liệu"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chỉnh sửa - hiển thị khi editing có giá trị */}
      {editing && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditing(null)}
        >
          <div 
            className="bg-white rounded-xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-2xl font-bold mb-5 text-gray-800">
               Chỉnh sửa thông tin
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Tên đầy đủ *
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Username *
                </label>
                <input
                  type="text"
                  value={editing.username}
                  onChange={(e) => handleEditChange("username", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={editing.address.street}
                  onChange={(e) => handleEditChange("street", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Phường/Xã
                </label>
                <input
                  type="text"
                  value={editing.address.suite}
                  onChange={(e) => handleEditChange("suite", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Thành phố
                </label>
                <input
                  type="text"
                  value={editing.address.city}
                  onChange={(e) => handleEditChange("city", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={editing.phone}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 font-medium">
                  Website
                </label>
                <input
                  type="text"
                  value={editing.website}
                  onChange={(e) => handleEditChange("website", e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-all"
                onClick={saveUser}
              >
                 Lưu thay đổi
              </button>
              <button 
                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
                onClick={() => setEditing(null)}
              >
                 Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
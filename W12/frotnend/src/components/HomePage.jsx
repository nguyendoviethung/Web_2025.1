import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css';

const API_URL = 'http://localhost:5000/api/students';

function HomePage() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [stuClass, setStuClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  // Lấy danh sách học sinh khi component load
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setStudents(response.data);
    } catch (error) {
      console.error('Lỗi khi fetch danh sách:', error);
      showMessage('Lỗi khi tải danh sách học sinh!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Thêm học sinh mới
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !age || !stuClass.trim()) {
      showMessage('Vui lòng điền đầy đủ thông tin!', 'error');
      return;
    }

    try {
      const newStu = { 
        name: name.trim(), 
        age: Number(age), 
        class: stuClass.trim() 
      };
      
      const response = await axios.post(API_URL, newStu);
      setStudents(prev => [...prev, response.data]);
      
      // Reset form
      setName('');
      setAge('');
      setStuClass('');
      
      showMessage(' Thêm học sinh thành công!', 'success');
    } catch (error) {
      console.error('Lỗi khi thêm:', error);
      showMessage('Lỗi khi thêm học sinh!', 'error');
    }
  };

  // Xóa học sinh
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa học sinh này?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setStudents(prevList => prevList.filter(s => s._id !== id));
      showMessage('Xóa học sinh thành công!', 'success');
    } catch (error) {
      console.error('Lỗi khi xóa:', error);
      showMessage('Lỗi khi xóa học sinh!', 'error');
    }
  };

  // Hiển thị thông báo
  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 3000);
  };

  // Lọc và sắp xếp danh sách
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB) return sortAsc ? -1 : 1;
    if (nameA > nameB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="container">
      {/* Thông báo */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Form thêm học sinh */}
      <div className="form-section">
        <h2> Thêm Học Sinh Mới</h2>
        <form onSubmit={handleAddStudent} className="add-form">
          <input
            type="text"
            placeholder="Họ và tên"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Tuổi"
            value={age}
            onChange={e => setAge(e.target.value)}
            min="1"
            max="100"
            required
          />
          <input
            type="text"
            placeholder="Lớp (VD: 10A1)"
            value={stuClass}
            onChange={e => setStuClass(e.target.value)}
            required
          />
          <button type="submit" className="btn-add">
            Thêm Học Sinh
          </button>
        </form>
      </div>

      {/* Thanh tìm kiếm và sắp xếp */}
      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          className="btn-sort" 
          onClick={() => setSortAsc(prev => !prev)}
        >
          Sắp xếp: {sortAsc ? ' A → Z' : ' Z → A'}
        </button>
      </div>

      {/* Danh sách học sinh */}
      <div className="list-section">
        <h2> Danh Sách Học Sinh ({sortedStudents.length})</h2>
        
        {loading ? (
          <p className="loading">Đang tải dữ liệu...</p>
        ) : sortedStudents.length === 0 ? (
          <p className="empty">
            {searchTerm 
              ? ' Không tìm thấy học sinh nào!' 
              : ' Chưa có học sinh nào. Hãy thêm học sinh mới!'}
          </p>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và Tên</th>
                <th>Tuổi</th>
                <th>Lớp</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student, index) => (
                <tr key={student._id}>
                  <td>{index + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.age}</td>
                  <td>{student.class}</td>
                  <td className="actions">
                    <button 
                      className="btn-edit"
                      onClick={() => navigate(`/edit/${student._id}`)}
                    >
                       Sửa
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(student._id)}
                    >
                       Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default HomePage;
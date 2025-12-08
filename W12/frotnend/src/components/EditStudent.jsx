import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditStudent.css';

const API_URL = 'http://localhost:5000/api/students';

function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [stuClass, setStuClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy thông tin học sinh hiện tại
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/${id}`);
        const student = response.data;
        setName(student.name);
        setAge(student.age);
        setStuClass(student.class);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin:', err);
        setError('Không thể tải thông tin học sinh!');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  // Cập nhật thông tin học sinh
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!name.trim() || !age || !stuClass.trim()) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      await axios.put(`${API_URL}/${id}`, {
        name: name.trim(),
        age: Number(age),
        class: stuClass.trim()
      });
      
      alert(' Cập nhật thông tin thành công!');
      navigate('/');
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      setError('Lỗi khi cập nhật thông tin!');
    }
  };

  if (loading) {
    return <div className="container"><p className="loading">Đang tải...</p></div>;
  }

  if (error && !name) {
    return (
      <div className="container">
        <p className="error">{error}</p>
        <button onClick={() => navigate('/')} className="btn-back">
           Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="edit-form-section">
        <h2> Chỉnh Sửa Thông Tin Học Sinh</h2>
        
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleUpdate} className="edit-form">
          <div className="form-group">
            <label>Họ và Tên:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Tuổi:</label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Lớp:</label>
            <input
              type="text"
              value={stuClass}
              onChange={e => setStuClass(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
               Lưu Thay Đổi
            </button>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/')}
            >
               Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStudent;
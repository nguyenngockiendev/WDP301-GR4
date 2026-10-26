import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import tenantsAPI from '../api/tenants-api';
import TenantList from '../components/TenantList';

export default function ManageTenants() {
  const { propertyId } = useParams();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
  }, [propertyId]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantsAPI.getTenantsByProperty(propertyId);
      setTenants(response.data || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách người thuê');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (searchTerm.trim()) {
        const response = await tenantsAPI.searchTenants(propertyId, searchTerm);
        setTenants(response.data || []);
      } else {
        fetchTenants();
      }
    } catch (error) {
      toast.error('Lỗi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-tenants-container p-4">
      <h2 className="mb-4">Quản Lý Người Thuê</h2>

      <div className="search-section card p-3 mb-4">
        <form onSubmit={handleSearch}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm theo tên, email hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">
              Tìm Kiếm
            </button>
            {searchTerm && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchTenants();
                }}
              >
                Xóa Bộ Lọc
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : (
        <TenantList tenants={tenants} />
      )}
    </div>
  );
}

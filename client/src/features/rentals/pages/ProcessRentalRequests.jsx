import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import rentalsAPI from '../api/rentals-api';
import RentalRequestList from '../components/RentalRequestList';

export default function ProcessRentalRequests() {
  const { propertyId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [propertyId, filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await rentalsAPI.getRentalRequestsByProperty(propertyId);
      const filtered = response.data.filter((req) => filter === 'all' || req.status === filter);
      setRequests(filtered);
    } catch (error) {
      toast.error('Lỗi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId, status, rejectReason) => {
    try {
      const data = { status };
      if (status === 'rejected') {
        data.rejectReason = rejectReason;
      }
      await rentalsAPI.processRentalRequest(requestId, data);
      toast.success(`Yêu cầu ${status === 'approved' ? 'được phê duyệt' : 'bị từ chối'}`);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xử lý yêu cầu');
    }
  };

  return (
    <div className="process-rentals-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Xử Lý Yêu Cầu Thuê Phòng</h2>
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('pending')}
          >
            Chờ Xử Lý
          </button>
          <button
            type="button"
            className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setFilter('approved')}
          >
            Đã Phê Duyệt
          </button>
          <button
            type="button"
            className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setFilter('rejected')}
          >
            Từ Chối
          </button>
          <button
            type="button"
            className={`btn ${filter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('all')}
          >
            Tất Cả
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : (
        <RentalRequestList
          requests={requests}
          onProcess={handleProcessRequest}
        />
      )}
    </div>
  );
}

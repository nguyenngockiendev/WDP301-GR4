import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import contractsAPI from '../api/contracts-api';
import ContractList from '../components/ContractList';
import ContractForm from '../components/ContractForm';

export default function ManageContracts() {
  const { propertyId } = useParams();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, [propertyId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractsAPI.getContractsByProperty(propertyId);
      setContracts(response.data || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = () => {
    setSelectedContract(null);
    setShowForm(true);
  };

  const handleEditContract = (contract) => {
    setSelectedContract(contract);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedContract(null);
  };

  const handleSaveContract = async (formData) => {
    try {
      if (selectedContract) {
        await contractsAPI.updateContract(selectedContract._id, formData);
        toast.success('Cập nhật hợp đồng thành công');
      } else {
        formData.property = propertyId;
        await contractsAPI.createContract(formData);
        toast.success('Tạo hợp đồng thành công');
      }
      fetchContracts();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu hợp đồng');
    }
  };

  return (
    <div className="manage-contracts-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản Lý Hợp Đồng</h2>
        <button className="btn btn-primary" onClick={handleAddContract}>
          + Tạo Hợp Đồng
        </button>
      </div>

      {showForm && (
        <div className="contract-form-container mb-4">
          <ContractForm
            contract={selectedContract}
            propertyId={propertyId}
            onSubmit={handleSaveContract}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : (
        <ContractList
          contracts={contracts}
          onEdit={handleEditContract}
          onRefresh={fetchContracts}
        />
      )}
    </div>
  );
}

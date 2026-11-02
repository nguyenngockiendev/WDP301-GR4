import React from 'react';
import ContractItem from './ContractItem';

export default function ContractList({ contracts, onEdit, onRefresh }) {
  return (
    <div className="contracts-list">
      {contracts.length === 0 ? (
        <div className="alert alert-info">Chưa có hợp đồng nào</div>
      ) : (
        <div className="row">
          {contracts.map((contract) => (
            <div key={contract._id} className="col-md-6 mb-4">
              <ContractItem
                contract={contract}
                onEdit={onEdit}
                onRefresh={onRefresh}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

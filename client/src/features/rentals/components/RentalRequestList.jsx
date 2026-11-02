import React, { useState } from 'react';
import RentalRequestItem from './RentalRequestItem';

export default function RentalRequestList({ requests, onProcess }) {
  return (
    <div className="rental-requests-list">
      {requests.length === 0 ? (
        <div className="alert alert-info">Không có yêu cầu nào</div>
      ) : (
        <div className="row">
          {requests.map((request) => (
            <div key={request._id} className="col-md-6 mb-4">
              <RentalRequestItem
                request={request}
                onProcess={onProcess}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

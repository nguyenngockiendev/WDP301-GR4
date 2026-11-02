export function validateCreateContract(body) {
  if (!body?.room || String(body.room).trim().length === 0) {
    return 'Phòng không được để trống';
  }
  if (!body?.representative || String(body.representative).trim().length === 0) {
    return 'Người đại diện không được để trống';
  }
  if (!body?.startDate) {
    return 'Ngày bắt đầu không được để trống';
  }
  if (!body?.endDate) {
    return 'Ngày kết thúc không được để trống';
  }
  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);
  if (startDate >= endDate) {
    return 'Ngày kết thúc phải sau ngày bắt đầu';
  }
  if (!body?.monthlyRent || Number(body.monthlyRent) <= 0) {
    return 'Tiền thuê hàng tháng phải lớn hơn 0';
  }
  if (body?.depositAmount && Number(body.depositAmount) < 0) {
    return 'Tiền đặt cọc không được âm';
  }
  return null;
}

export function validateUpdateContract(body) {
  if (body?.startDate && body?.endDate) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (startDate >= endDate) {
      return 'Ngày kết thúc phải sau ngày bắt đầu';
    }
  }
  if (body?.monthlyRent && Number(body.monthlyRent) <= 0) {
    return 'Tiền thuê hàng tháng phải lớn hơn 0';
  }
  if (body?.depositAmount && Number(body.depositAmount) < 0) {
    return 'Tiền đặt cọc không được âm';
  }
  return null;
}

export function validateRenewContract(body) {
  if (!body?.newEndDate) {
    return 'Ngày kết thúc mới không được để trống';
  }
  return null;
}

export function validateChangeRepresentative(body) {
  if (!body?.newRepresentative || String(body.newRepresentative).trim().length === 0) {
    return 'Người đại diện mới không được để trống';
  }
  return null;
}

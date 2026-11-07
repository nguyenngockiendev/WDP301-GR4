
export function validateCreateTerminationRequest(body) {
  if (!body?.contractId || String(body.contractId).trim() === '') {
    return 'Hợp đồng không được để trống';
  }

  if (!body?.reason || body.reason.trim() === '') {
    return 'Lý do trả phòng không được để trống';
  }

  return null;
}

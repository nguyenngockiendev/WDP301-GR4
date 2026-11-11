import React, { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardCheck, Info, LoaderCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CheckoutRequestForm from '../components/CheckoutRequestForm';
import terminationRequestsAPI from '../api/terminationrequests-api';

export default function SubmitCheckoutRequest() {
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibleContracts, setEligibleContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [eligibilityError, setEligibilityError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedContractId = searchParams.get('contractId') || undefined;
  const eligibleContract = eligibleContracts.find(
    (contract) => contract._id === (requestedContractId || selectedContractId),
  );

  useEffect(() => {
    let isMounted = true;

    const checkEligibility = async () => {
      try {
        setCheckingEligibility(true);
        setEligibilityError('');
        setEligibleContracts([]);
        setSelectedContractId('');

        const response = await terminationRequestsAPI.checkEligibility(requestedContractId);
        if (!isMounted) return;
        const result = response?.data ?? response;

        let contracts = [];
        if (Array.isArray(result?.contracts)) {
          contracts = result.contracts.filter((contract) => contract.canSubmit);
        } else if (result?.canSubmit && result.contract) {
          contracts = [result.contract];
        }

        if (requestedContractId && !contracts.some((contract) => contract._id === requestedContractId)) {
          setEligibilityError('Hợp đồng này không đủ điều kiện gửi yêu cầu trả phòng hoặc đã có yêu cầu đang xử lý.');
          return;
        }

        if (!contracts.length) {
          setEligibilityError('Bạn chưa có hợp đồng đủ điều kiện gửi yêu cầu trả phòng.');
          return;
        }

        setEligibleContracts(contracts);
        if (contracts.length === 1) setSelectedContractId(contracts[0]._id);
      } catch (error) {
        if (!isMounted) return;
        const message =
          error.response?.data?.message ||
          error.message ||
          'Không thể kiểm tra điều kiện gửi yêu cầu trả phòng';

        setEligibilityError(message);
      } finally {
        if (isMounted) {
          setCheckingEligibility(false);
        }
      }
    };

    checkEligibility();

    return () => {
      isMounted = false;
    };
  }, [requestedContractId]);

  const handleSubmit = async (payload) => {
    if (loading || !eligibleContract) return;

    try {
      setLoading(true);
      await terminationRequestsAPI.create({
        contractId: eligibleContract._id,
        moveOutDate: payload.moveOutDate,
        reason: payload.reason,
        refundBankAccount: payload.refundBankAccount,
      });
      toast.success('Gửi yêu cầu trả phòng thành công');
      navigate('/checkout-requests');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Không thể gửi yêu cầu trả phòng',
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingEligibility) {
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center py-7">
        <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 px-6 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <LoaderCircle size={20} className="animate-spin text-emerald-600" />
          Đang kiểm tra hợp đồng của bạn...
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl py-7">
      <Link
        to="/checkout-requests"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-emerald-700"
      >
        <ArrowLeft size={16} /> Quay lại yêu cầu của tôi
      </Link>

      <div className="mb-7">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
          <ClipboardCheck size={14} /> CHECKOUT REQUEST
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
          Gửi yêu cầu trả phòng
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Gửi thông tin đến chủ nhà để bắt đầu quy trình trả phòng và thanh lý hợp đồng.
        </p>
      </div>

      {eligibilityError && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {eligibilityError}
        </p>
      )}

      {!requestedContractId && eligibleContracts.length > 1 && (
        <div className="mb-5 rounded-2xl bg-white/85 p-4">
          <label htmlFor="checkout-contract" className="mb-2 block text-sm font-bold text-slate-700">
            Chọn hợp đồng trả phòng
          </label>
          <select
            id="checkout-contract"
            value={selectedContractId}
            onChange={(event) => setSelectedContractId(event.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="">Chọn phòng và hợp đồng</option>
            {eligibleContracts.map((contract) => (
              <option key={contract._id} value={contract._id}>
                {contract.room?.roomNumber || 'Phòng đang thuê'}
                {contract.room?.property?.name && ` · ${contract.room.property.name}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {eligibleContract && (
        <>
          <div className="mb-5 flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm leading-6 text-sky-800">
            <Info size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>Phòng trả: <strong>{eligibleContract.room?.roomNumber || 'Phòng đang thuê'}</strong></p>
              <p>
                Sau khi gửi, bạn có thể theo dõi tiến độ xử lý trong mục “Yêu cầu trả phòng của tôi”.
                Việc gửi yêu cầu chưa đồng nghĩa hợp đồng đã kết thúc.
              </p>
            </div>
          </div>
          <CheckoutRequestForm key={eligibleContract._id} onSubmit={handleSubmit} loading={loading} />
        </>
      )}
    </section>
  );
}

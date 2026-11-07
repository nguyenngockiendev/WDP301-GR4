import React, { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardCheck, Info, LoaderCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CheckoutRequestForm from '../components/CheckoutRequestForm';
import terminationRequestsAPI from '../api/terminationrequests-api';

export default function SubmitCheckoutRequest() {
  const [loading, setLoading] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const [eligibleContract, setEligibleContract] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkEligibility = async () => {
      try {
        setCheckingEligibility(true);

        const response = await terminationRequestsAPI.checkEligibility();
        const result = response?.data ?? response;

        if (!result?.canSubmit) {
          toast.warning(
            'Bạn chưa có hợp đồng đang hoạt động và còn thời hạn nên không thể gửi yêu cầu trả phòng.',
          );
          navigate('/checkout-requests', { replace: true });
          return;
        }

        if (isMounted) {
          setEligibleContract(result.contract || null);
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          'Không thể kiểm tra điều kiện gửi yêu cầu trả phòng';

        toast.error(message);
        navigate('/checkout-requests', { replace: true });
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
  }, [navigate]);

  const handleSubmit = async (payload) => {
    try {
      setLoading(true);
      await terminationRequestsAPI.create(payload);
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

  if (!eligibleContract) {
    return null;
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

      <div className="mb-5 flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm leading-6 text-sky-800">
        <Info size={18} className="mt-0.5 shrink-0" />
        <div>
          <p>
            Hợp đồng hợp lệ của bạn:{' '}
            <strong>
              {eligibleContract.room?.roomNumber || 'Phòng đang thuê'}
            </strong>
          </p>
          <p>
            Sau khi gửi, bạn có thể theo dõi tiến độ xử lý trong mục “Yêu cầu trả phòng của tôi”.
            Việc gửi yêu cầu chưa đồng nghĩa hợp đồng đã kết thúc.
          </p>
        </div>
      </div>

      <CheckoutRequestForm onSubmit={handleSubmit} loading={loading} />
    </section>
  );
}

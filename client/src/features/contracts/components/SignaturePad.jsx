import { useRef, useState } from 'react';

export default function SignaturePad({ disabled, onSign }) {
  const canvas = useRef(null);
  const pointer = useRef(null);
  const [hasInk, setHasInk] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function position(event) {
    const bounds = canvas.current.getBoundingClientRect();
    return [
      (event.clientX - bounds.left) * canvas.current.width / bounds.width,
      (event.clientY - bounds.top) * canvas.current.height / bounds.height,
    ];
  }

  function start(event) {
    if (disabled || pointer.current !== null || event.button !== 0) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    const context = canvas.current.getContext('2d');
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
    context.beginPath();
    context.moveTo(...position(event));
  }

  function draw(event) {
    if (pointer.current !== event.pointerId) return;
    const context = canvas.current.getContext('2d');
    context.lineTo(...position(event));
    context.stroke();
    setHasInk(true);
  }

  function stop(event) {
    if (pointer.current === event.pointerId) pointer.current = null;
  }

  function clear() {
    canvas.current.getContext('2d').clearRect(0, 0, 600, 200);
    setHasInk(false);
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-slate-800">Vẽ chữ ký bằng chuột hoặc ngón tay</p>
      <canvas ref={canvas} width={600} height={200} aria-label="Khung vẽ chữ ký"
        className="block h-auto w-full max-w-xl touch-none rounded-xl border border-slate-300 bg-white"
        onPointerDown={start} onPointerMove={draw} onPointerUp={stop}
        onPointerCancel={stop} onLostPointerCapture={stop} />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={agreed} disabled={disabled} onChange={event => setAgreed(event.target.checked)} />
        Tôi đã đọc và đồng ý với nội dung hợp đồng.
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={disabled || !hasInk} onClick={clear} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Vẽ lại</button>
        <button type="button" disabled={disabled || !hasInk || !agreed} onClick={() => onSign(canvas.current.toDataURL('image/png'))}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {disabled ? 'Đang xử lý…' : 'Xác nhận ký'}
        </button>
      </div>
    </div>
  );
}

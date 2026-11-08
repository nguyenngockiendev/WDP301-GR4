import { useState } from 'react';
import { ImageOff } from 'lucide-react';
export default function RoomImage({ src, alt = '', className = '' }) {
  const [failedSource, setFailedSource] = useState(null);
  if (!src || failedSource === src) return <div className={className + ' bg-slate-100 flex flex-col items-center justify-center text-slate-400'}><ImageOff size={28} /><span className="text-xs mt-2">{src ? 'Không tải được ảnh' : 'Chưa có hình ảnh'}</span></div>;
  return <img src={src} alt={alt} className={className} onError={() => setFailedSource(src)} />;
}

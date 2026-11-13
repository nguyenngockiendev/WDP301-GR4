import React, { useMemo } from 'react';
import { CONTRACT_DOC_CSS, CONTRACT_FONT_LINK, contractContentToHtml } from '../utils/contractDocumentHtml';

/** Hiển thị văn bản hợp đồng dạng trang giấy: tiêu đề căn giữa, điều khoản in đậm, khối chữ ký chia cột. */
export default function ContractDocumentView({ content, className = '' }) {
  // Nội dung đã được escape trong contractContentToHtml
  const html = useMemo(() => contractContentToHtml(content), [content]);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-6 py-8 sm:px-12 sm:py-10 shadow-sm ${className}`}>
      <link rel="stylesheet" href={CONTRACT_FONT_LINK} />
      <style>{CONTRACT_DOC_CSS}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

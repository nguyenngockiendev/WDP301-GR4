/**
 * Chuyển nội dung hợp đồng (văn bản thuần, đã điền biến) thành HTML trình bày đẹp.
 * Dùng chung cho xem trên web và bản in, để hai nơi hiển thị giống nhau.
 */

const escapeHtml = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Chữ có dấu gõ kiểu "tổ hợp" (dấu tách rời) hiển thị lệch -> gộp về dạng dựng sẵn
const normalizeText = text => String(text || '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, '    ');

const hasLetters = s => /\p{L}/u.test(s);
const isUpperLine = s => hasLetters(s) && s === s.toLocaleUpperCase('vi-VN');

const ARTICLE_RE = /^(Điều\s+\d+\s*[.:])\s*(.*)$/iu;
const LIST_RE = /^(\d+[.)]|[-•])\s+/u;
const COLUMN_SPLIT_RE = /\s{3,}/;

/** "BÊN CHO THUÊ (Bên A): ..." / "Người ở cùng:" -> tách nhãn để in đậm */
const splitLabel = line => {
  const idx = line.indexOf(':');
  if (idx <= 0) return null;
  const label = line.slice(0, idx).trim();
  if (label.length > 40 || /[\d,]/.test(label)) return null;
  return { label, rest: line.slice(idx + 1).trim() };
};

/**
 * Mẫu cũ có thể bị chèn nhầm biến dính liền trước tiêu đề
 * ("Nguyễn Chủ NhàNguyễn Chủ Nhà0901...HỢP ĐỒNG THUÊ PHÒNG TRỌ") -> bỏ phần rác trước tiêu đề.
 */
const stripJunkBeforeTitle = lines => {
  const first = lines.findIndex(l => l.trim());
  if (first < 0) return lines;
  const match = lines[first].match(/^(.*?)(HỢP\s+ĐỒNG\b.*)$/u);
  if (match && match[1].trim() && isUpperLine(match[2].trim())) {
    const next = [...lines];
    next[first] = match[2];
    return next;
  }
  return lines;
};

export const contractContentToHtml = rawContent => {
  const lines = stripJunkBeforeTitle(normalizeText(rawContent).split('\n'));
  const html = [];
  let titleDone = false;
  let pendingGap = false;

  const push = (cls, inner) => {
    html.push(`<div class="${cls}${pendingGap ? ' gap' : ''}">${inner}</div>`);
    pendingGap = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (html.length) pendingGap = true;
      continue;
    }

    // Khối chữ ký / các cột canh bằng nhiều dấu cách: "BÊN A        BÊN B"
    const columns = line.split(COLUMN_SPLIT_RE);
    if (columns.length >= 2) {
      const cells = columns.map(c => `<span class="${isUpperLine(c) ? 'cd-strong' : 'cd-note'}">${escapeHtml(c)}</span>`);
      push(`cd-cols cd-cols-${Math.min(columns.length, 4)}`, cells.join(''));
      continue;
    }

    // Tiêu đề: dòng IN HOA đầu tiên
    if (!titleDone && isUpperLine(line) && line.length <= 120) {
      titleDone = true;
      push('cd-title', escapeHtml(line));
      continue;
    }

    const article = line.match(ARTICLE_RE);
    if (article) {
      push('cd-article', `<strong>${escapeHtml(article[1])}</strong> ${escapeHtml(article[2])}`);
      continue;
    }

    if (LIST_RE.test(line)) {
      push('cd-item', escapeHtml(line));
      continue;
    }

    if (isUpperLine(line) && line.length <= 80) {
      push('cd-heading', escapeHtml(line));
      continue;
    }

    const labeled = splitLabel(line);
    if (labeled) {
      push('cd-line', `<strong>${escapeHtml(labeled.label)}:</strong>${labeled.rest ? ` ${escapeHtml(labeled.rest)}` : ''}`);
      continue;
    }

    push('cd-para', escapeHtml(line));
  }

  const hasNationalHeader = /CỘNG\s+HÒA\s+XÃ\s+HỘI/iu.test(normalizeText(rawContent));
  const header = hasNationalHeader
    ? ''
    : `<div class="cd-national">
        <div class="cd-national-1">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="cd-national-2">Độc lập - Tự do - Hạnh phúc</div>
        <div class="cd-national-rule"></div>
      </div>`;

  return `<div class="contract-doc">${header}${html.join('')}</div>`;
};

export const CONTRACT_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap';

export const CONTRACT_DOC_CSS = `
.contract-doc{font-family:'Noto Serif','Times New Roman',Tinos,serif;font-size:15px;line-height:1.75;color:#1f2937;text-align:justify;word-break:break-word}
.contract-doc .cd-national{text-align:center;margin-bottom:22px}
.contract-doc .cd-national-1{font-weight:700;font-size:14px;letter-spacing:.02em}
.contract-doc .cd-national-2{font-weight:700;font-size:14.5px}
.contract-doc .cd-national-rule{width:170px;height:1px;background:#1f2937;margin:4px auto 0}
.contract-doc .cd-title{text-align:center;font-weight:700;font-size:20px;letter-spacing:.04em;margin:8px 0 20px;color:#111827}
.contract-doc .cd-heading{font-weight:700;margin-top:10px}
.contract-doc .cd-para{text-indent:0}
.contract-doc .cd-line{margin:2px 0}
.contract-doc .cd-item{padding-left:28px;margin:2px 0}
.contract-doc .cd-article{margin:6px 0;padding-left:0}
.contract-doc .cd-article strong{color:#111827}
.contract-doc strong{font-weight:700}
.contract-doc .cd-cols{display:grid;text-align:center;column-gap:24px}
.contract-doc .cd-cols-2{grid-template-columns:1fr 1fr}
.contract-doc .cd-cols-3{grid-template-columns:repeat(3,1fr)}
.contract-doc .cd-cols-4{grid-template-columns:repeat(4,1fr)}
.contract-doc .cd-cols .cd-strong{font-weight:700}
.contract-doc .cd-cols .cd-note{font-style:italic;font-size:13.5px;color:#4b5563}
.contract-doc > .gap{margin-top:16px}
.contract-doc > .cd-cols.gap{margin-top:36px}
.contract-doc > .cd-cols + .cd-cols{margin-top:0}
.contract-doc > .cd-cols:last-child{padding-bottom:90px}
`;

/** Trang HTML đầy đủ để in hợp đồng. */
export const buildContractPrintPage = (title, content) => `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>${escapeHtml(normalizeText(title))}</title>
<link rel="stylesheet" href="${CONTRACT_FONT_LINK}">
<style>
@page{size:A4;margin:20mm 18mm 20mm 22mm}
body{margin:0;background:#fff}
.page{max-width:760px;margin:24px auto}
@media print{.page{margin:0;max-width:none}}
${CONTRACT_DOC_CSS}
.contract-doc > .cd-cols:last-child{padding-bottom:120px}
</style></head><body><div class="page">${contractContentToHtml(content)}</div></body></html>`;

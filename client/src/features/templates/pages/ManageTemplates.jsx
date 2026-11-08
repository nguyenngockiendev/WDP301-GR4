import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Search, FileText, FileCheck2, FileX2, Pencil, EyeOff, Eye } from 'lucide-react';
import templatesAPI from '../api/templates-api';
import TemplateForm from '../components/TemplateForm';
import { formatDate } from '../../../shared/utils/format';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang dùng' },
  { value: 'inactive', label: 'Ngừng dùng' },
];

const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

/** Trang chủ trọ (landlord) tạo và quản lý mẫu hợp đồng. */
export default function ManageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined: đóng, null: tạo mới, object: sửa

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await templatesAPI.getTemplates();
      setTemplates(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách mẫu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    templatesAPI
      .getPlaceholders()
      .then(res => setPlaceholders(res.data || []))
      .catch(() => toast.error('Không tải được danh sách biến'));
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Tổng số mẫu', value: templates.length, icon: FileText, cls: 'from-emerald-500 to-teal-400' },
      { label: 'Đang dùng', value: templates.filter(t => t.status === 'active').length, icon: FileCheck2, cls: 'from-green-500 to-emerald-400' },
      { label: 'Ngừng dùng', value: templates.filter(t => t.status === 'inactive').length, icon: FileX2, cls: 'from-slate-500 to-slate-400' },
    ],
    [templates],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return templates.filter(
      t => (statusFilter === 'all' || t.status === statusFilter) && (!kw || t.title.toLowerCase().includes(kw)),
    );
  }, [templates, statusFilter, keyword]);

  const handleSave = async data => {
    try {
      if (editing) {
        await templatesAPI.updateTemplate(editing._id, data);
        toast.success('Cập nhật mẫu hợp đồng thành công');
      } else {
        await templatesAPI.createTemplate(data);
        toast.success('Tạo mẫu hợp đồng thành công');
      }
      setEditing(undefined);
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu mẫu hợp đồng');
    }
  };

  const handleToggleStatus = async template => {
    const next = template.status === 'active' ? 'inactive' : 'active';
    if (next === 'inactive' && !window.confirm('Ngừng dùng mẫu này? Quản lý sẽ không chọn được mẫu khi lập hợp đồng mới.')) return;
    try {
      await templatesAPI.updateTemplateStatus(template._id, next);
      toast.success(next === 'active' ? 'Đã bật lại mẫu hợp đồng' : 'Đã ngừng dùng mẫu hợp đồng');
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Mẫu hợp đồng</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Soạn mẫu hợp đồng để quản lý chọn và điền thông tin khi lập hợp đồng thuê
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer self-start"
        >
          <Plus size={16} className="stroke-[2.5]" />
          Tạo mẫu mới
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${card} p-4 flex items-center gap-3.5`}>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${s.cls} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400">{s.label}</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${card} p-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                  : 'bg-slate-100/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm theo tên mẫu..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:bg-white transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-3xl bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <FileText size={28} className="mx-auto text-slate-300" />
          <p className="text-sm font-semibold text-slate-500 mt-2">
            {templates.length === 0 ? 'Chưa có mẫu hợp đồng nào. Hãy tạo mẫu đầu tiên.' : 'Không có mẫu phù hợp.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div key={t._id} className={`${card} p-5 flex flex-col`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">{t.title}</h3>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                    t.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {t.status === 'active' ? 'Đang dùng' : 'Ngừng dùng'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 whitespace-pre-line line-clamp-4">{t.content}</p>
              <p className="mt-3 text-[11px] font-semibold text-slate-400">Cập nhật: {formatDate(t.updatedAt)}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditing(t)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                >
                  <Pencil size={13} /> Sửa
                </button>
                <button
                  onClick={() => handleToggleStatus(t)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    t.status === 'active'
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {t.status === 'active' ? <><EyeOff size={13} /> Ngừng dùng</> : <><Eye size={13} /> Dùng lại</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && (
        <TemplateForm
          template={editing}
          placeholders={placeholders}
          onSubmit={handleSave}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}

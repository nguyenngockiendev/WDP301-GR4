import api from '../../../shared/api/axiosClient';

const templatesAPI = {
  getTemplates: async (params) => api.get('/contract-templates', { params }),

  getPlaceholders: async () => api.get('/contract-templates/placeholders'),

  getTemplateById: async (templateId) => api.get(`/contract-templates/${templateId}`),

  createTemplate: async (data) => api.post('/contract-templates', data),

  updateTemplate: async (templateId, data) => api.put(`/contract-templates/${templateId}`, data),

  updateTemplateStatus: async (templateId, status) =>
    api.patch(`/contract-templates/${templateId}/status`, { status }),
};

export default templatesAPI;

import api from '../../../shared/api/axiosClient';

const roomsAPI = {
  getRoomsByProperty: async (propertyId) => {
    return api.get(`/rooms/property/${propertyId}`);
  },

  getRoomById: async (roomId) => {
    return api.get(`/rooms/${roomId}`);
  },

  createRoom: async (roomData) => {
    return api.post('/rooms', roomData);
  },

  updateRoom: async (roomId, roomData) => {
    return api.put(`/rooms/${roomId}`, roomData);
  },

  updateRoomStatus: async (roomId, status) => {
    return api.patch(`/rooms/${roomId}/status`, { status });
  },

  deactivateRoom: async (roomId) => {
    return api.patch(`/rooms/${roomId}/deactivate`);
  },

  searchAvailableRooms: async (filters) => {
    return api.get('/rooms/search', { params: filters });
  },
};

export default roomsAPI;

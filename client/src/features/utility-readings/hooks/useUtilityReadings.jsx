import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getUtilityContractsAPI,
  getUtilityPropertiesAPI,
  getUtilityRoomsAPI,
  getUtilityReadingsAPI,
  saveUtilityReadingsAPI,
} from '../api/utility-readings-api';

const emptyRoomData = { propertyId: '', rooms: [], contracts: [], error: '', rateError: '' };

function getCurrentMonth() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return today.getFullYear() + '-' + month;
}

export default function useUtilityReadings() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [billingMonth, setBillingMonth] = useState(() =>
    /^20\d{2}-(0[1-9]|1[0-2])$/.test(searchParams.get('billingMonth') || '')
      ? searchParams.get('billingMonth')
      : getCurrentMonth(),
  );
  const [roomData, setRoomData] = useState(emptyRoomData);
  const [savedData, setSavedData] = useState({ periodKey: '', readings: {}, error: '' });
  const [draftsByPeriod, setDraftsByPeriod] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState({ periodKey: '', error: '' });

  const periodKey = propertyId + ':' + billingMonth;
  const validMonth = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(billingMonth);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      try {
        const response = await getUtilityPropertiesAPI();
        if (!active) return;
        const list = response.data || [];
        const currentPropertyId = localStorage.getItem('currentPropertyId');
        const selected = list.find(property => property._id === currentPropertyId) || list[0];
        setProperties(list);
        setPropertyId(selected?._id || '');
      } catch (error) {
        if (active) {
          setPropertyError(error.response?.data?.message || 'Không tải được danh sách nhà trọ.');
        }
      } finally {
        if (active) setLoadingProperties(false);
      }
    };

    loadProperties();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    let active = true;

    const loadRooms = async () => {
      const [roomResult, contractResult] = await Promise.allSettled([
        getUtilityRoomsAPI(propertyId),
        getUtilityContractsAPI(propertyId),
      ]);
      if (!active) return;

      const rooms = roomResult.status === 'fulfilled' ? roomResult.value.data || [] : [];
      const contracts =
        contractResult.status === 'fulfilled' ? contractResult.value.data || [] : [];
      const error =
        roomResult.status === 'rejected'
          ? roomResult.reason.response?.data?.message || 'Không tải được danh sách phòng.'
          : '';
      const rateError =
        contractResult.status === 'rejected' ? 'Không tải được hợp đồng để đối chiếu đơn giá.' : '';
      setRoomData({ propertyId, rooms, contracts, error, rateError });
    };

    loadRooms();
    return () => {
      active = false;
    };
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId || !validMonth) return;
    let active = true;

    const loadReadings = async () => {
      try {
        const response = await getUtilityReadingsAPI(propertyId, billingMonth);
        if (!active) return;
        const readings = {};
        for (const reading of response.data || []) readings[reading.room] = reading;
        setSavedData({ periodKey, readings, error: '' });
      } catch (error) {
        if (!active) return;
        setSavedData({
          periodKey,
          readings: {},
          error: error.response?.data?.message || 'Không tải được chỉ số điện nước.',
        });
      }
    };

    loadReadings();
    return () => {
      active = false;
    };
  }, [propertyId, billingMonth, periodKey, validMonth]);

  const loadingRooms = Boolean(propertyId && roomData.propertyId !== propertyId);
  const loadingReadings = Boolean(propertyId && validMonth && savedData.periodKey !== periodKey);
  const savedReadings = savedData.periodKey === periodKey ? savedData.readings : {};
  const drafts = draftsByPeriod[periodKey] || {};
  const readings = {};
  const pendingRooms = [];

  if (!loadingRooms && !loadingReadings) {
    for (const room of roomData.rooms) {
      const saved = savedReadings[room._id];
      const draft = drafts[room._id] || {};
      const hasDraft = Object.values(draft).some(value => value !== '');
      const canEdit = !saved?.isRecorded && !saved?.isLocked;
      readings[room._id] = canEdit ? { ...saved, ...draft, hasDraft } : saved;
      if (canEdit && hasDraft) pendingRooms.push(room);
    }
  }

  const selectProperty = value => {
    if (value === propertyId) return;
    setSavedData({ periodKey: '', readings: {}, error: '' });
    setPropertyId(value);
  };

  const selectBillingMonth = value => {
    if (value === billingMonth) return;
    setSavedData({ periodKey: '', readings: {}, error: '' });
    setBillingMonth(value);
  };

  const changeReading = (roomId, field, value) => {
    setSaveResult({ periodKey, error: '' });
    setDraftsByPeriod(previous => {
      const periodReadings = previous[periodKey] || {};
      return {
        ...previous,
        [periodKey]: {
          ...periodReadings,
          [roomId]: { ...periodReadings[roomId], [field]: value },
        },
      };
    });
  };

  const saveReadings = async () => {
    if (saving || !pendingRooms.length) return;
    setSaveResult({ periodKey, error: '' });
    const data = { propertyId, billingMonth, readings: [] };

    for (const room of pendingRooms) {
      const reading = readings[room._id];
      const values = [
        reading.oldElectricity,
        reading.newElectricity,
        reading.oldWater,
        reading.newWater,
      ];
      const invalid = values.some(
        value =>
          value == null || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0,
      );
      if (invalid) {
        setSaveResult({ periodKey, error: `Nhập đủ chỉ số hợp lệ cho phòng ${room.roomNumber}.` });
        return;
      }
      const oldElectricity = Number(reading.oldElectricity);
      const newElectricity = Number(reading.newElectricity);
      const oldWater = Number(reading.oldWater);
      const newWater = Number(reading.newWater);
      if (newElectricity < oldElectricity || newWater < oldWater) {
        setSaveResult({
          periodKey,
          error: `Số mới của phòng ${room.roomNumber} phải lớn hơn hoặc bằng số cũ.`,
        });
        return;
      }

      const item = { room: room._id, newElectricity, newWater };
      if (!reading.previousBillingMonth) {
        item.oldElectricity = oldElectricity;
        item.oldWater = oldWater;
      }
      data.readings.push(item);
    }

    try {
      setSaving(true);
      const response = await saveUtilityReadingsAPI(data);
      setSavedData(previous => {
        if (previous.periodKey !== periodKey) return previous;
        const updated = { ...previous.readings };
        for (const reading of response.data) updated[reading.room] = reading;
        return { ...previous, readings: updated };
      });
      setDraftsByPeriod(previous => {
        const remaining = { ...previous[periodKey] };
        for (const reading of response.data) delete remaining[reading.room];
        return { ...previous, [periodKey]: remaining };
      });
      toast.success(response.message || 'Đã lưu chỉ số điện nước!');
    } catch (error) {
      setSaveResult({
        periodKey,
        error: error.response?.data?.message || 'Không lưu được chỉ số điện nước.',
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    properties,
    propertyId,
    selectProperty,
    billingMonth,
    selectBillingMonth,
    loadingProperties,
    loadingRooms,
    loadingReadings,
    validMonth,
    error:
      propertyError ||
      (loadingRooms ? '' : roomData.error) ||
      (savedData.periodKey === periodKey ? savedData.error : ''),
    rateError: loadingRooms ? '' : roomData.rateError,
    rooms: loadingRooms ? [] : roomData.rooms,
    contracts: loadingRooms ? [] : roomData.contracts,
    readings,
    changeReading,
    pendingCount: pendingRooms.length,
    saving,
    saveReadings,
    saveError: saveResult.periodKey === periodKey ? saveResult.error : '',
  };
}

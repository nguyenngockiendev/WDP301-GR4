import React from 'react';
import ManageRooms from '../pages/ManageRooms';
import BrowseRooms from '../pages/BrowseRooms';
import RoomDetail from '../pages/RoomDetail';

const roomsRoutes = [
  {
    path: '/properties/:propertyId/rooms',
    element: <ManageRooms />,
  },
  {
    path: '/browse-rooms',
    element: <BrowseRooms />,
  },
  {
    path: '/rooms/:roomId',
    element: <RoomDetail />,
  },
];

export default roomsRoutes;

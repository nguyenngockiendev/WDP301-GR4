import React from 'react';
import ManageRooms from '../pages/ManageRooms';
import BrowseRooms from '../pages/BrowseRooms';

const roomsRoutes = [
  {
    path: '/properties/:propertyId/rooms',
    element: <ManageRooms />,
  },
  {
    path: '/browse-rooms',
    element: <BrowseRooms />,
  },
];

export default roomsRoutes;

import { Router } from 'express';

export default function workspaceRoutes(controller) {
  const router = Router();
  router.get('/dashboard', controller.dashboard);
  router.get('/workspace/:module', controller.list);
  return router;
}

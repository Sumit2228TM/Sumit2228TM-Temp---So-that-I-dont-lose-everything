
/**
 * Session Lifecycle Routes
 */

// GET /api/sessions/ice-servers
/*router.get('/ice-servers', async (req, res) => {
  try {
    const response = await fetch(
      `https://${process.env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`
    );
    const iceServers = await response.json();
    return res.json(iceServers);
  } catch (error) {
    console.error('Failed to fetch ICE servers:', error);
    // Fallback to free STUN if Metered is down
    return res.json([
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]);
  }
});*/













/*router.get('/ice-servers', async (req, res) => {
  try {
    const url = `https://${process.env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`;
    console.log('[ICE] Fetching from:', url);  // ← add this
    
    const response = await fetch(url);
    const iceServers = await response.json();
    
    console.log('[ICE] Response:', JSON.stringify(iceServers)); // ← add this
    
    return res.json(iceServers);
  } catch (error) {
    console.error('Failed to fetch ICE servers:', error);
    return res.json([
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]);
  }
});



router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/:id/start', startSession);
router.post('/:id/complete', completeSession);

export default router;*/











import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getSessions, getSession, startSession, completeSession } from '../controller/session.controller.js';

const router = Router();

// ─── Public routes (no auth needed) ──────────────────────────────────────────
router.get('/ice-servers', async (req, res) => {
  try {
    const url = `https://${process.env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`;
    const response = await fetch(url);
    const iceServers = await response.json();
    return res.json(iceServers);
  } catch (error) {
    console.error('Failed to fetch ICE servers:', error);
    return res.json([
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ]);
  }
});

// ─── Protected routes (auth required) ────────────────────────────────────────
router.use(authenticate);

router.get('/', getSessions);
router.get('/:id', getSession);
router.post('/:id/start', startSession);
router.post('/:id/complete', completeSession);

export default router;

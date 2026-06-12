import { Router, type Request, type Response } from 'express';
import { getLiveRooms, getLiveRoomById, createLiveRoom, updateLiveRoom } from '../models/live.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const params = {
      platform_id: req.query.platform_id ? Number(req.query.platform_id) : undefined,
      account_id: req.query.account_id ? Number(req.query.account_id) : undefined,
      status: req.query.status as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.page_size ? Number(req.query.page_size) : (req.query.pageSize ? Number(req.query.pageSize) : 20),
      sort_by: req.query.sort_by as string | undefined,
      sort_order: req.query.sort_order as string | undefined,
    };

    const result = getLiveRooms(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const liveRoom = getLiveRoomById(Number(id));

    if (!liveRoom) {
      return res.status(404).json({
        success: false,
        error: 'Live room not found',
      });
    }

    res.json({
      success: true,
      data: liveRoom,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const liveRoom = createLiveRoom(req.body);

    res.status(201).json({
      success: true,
      data: liveRoom,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const liveRoom = updateLiveRoom(Number(id), req.body);

    if (!liveRoom) {
      return res.status(404).json({
        success: false,
        error: 'Live room not found',
      });
    }

    res.json({
      success: true,
      data: liveRoom,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

import { Router, type Request, type Response } from 'express';
import { getPosts, getPostById, createPost, updatePost, getTopPosts, getPostStatsByDateRange, getContentTypeDistribution } from '../models/post.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const params = {
      platform_id: req.query.platform_id ? Number(req.query.platform_id) : undefined,
      account_id: req.query.account_id ? Number(req.query.account_id) : undefined,
      content_type: req.query.content_type as string | undefined,
      channel: req.query.channel as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      keyword: req.query.keyword as string | undefined,
      sort_by: req.query.sort_by as string | undefined,
      sort_order: req.query.sort_order as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.page_size ? Number(req.query.page_size) : (req.query.pageSize ? Number(req.query.pageSize) : 20),
    };

    const result = getPosts(params);

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

router.get('/top', (req: Request, res: Response) => {
  try {
    const { platform_id, limit, sort_by } = req.query;

    const posts = getTopPosts(
      platform_id ? Number(platform_id) : undefined,
      limit ? Number(limit) : 10,
      sort_by as string | undefined
    );

    res.json({
      success: true,
      data: posts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/stats/by-date', (req: Request, res: Response) => {
  try {
    const { account_id, start_date, end_date } = req.query;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: 'account_id is required',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const stats = getPostStatsByDateRange(
      Number(account_id),
      (start_date as string) || defaultStart,
      (end_date as string) || today
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/content-type-distribution', (req: Request, res: Response) => {
  try {
    const { account_id, platform_id } = req.query;

    const distribution = getContentTypeDistribution(
      account_id ? Number(account_id) : undefined,
      platform_id ? Number(platform_id) : undefined
    );

    res.json({
      success: true,
      data: distribution,
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
    const post = getPostById(Number(id));

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.json({
      success: true,
      data: post,
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
    const post = createPost(req.body);

    res.status(201).json({
      success: true,
      data: post,
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
    const post = updatePost(Number(id), req.body);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

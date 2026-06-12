import { Router, type Request, type Response } from 'express';
import { getAllAccounts, getAccountById, createAccount, updateAccount, deleteAccount } from '../models/account.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { platform_id, status, page } = req.query;
  const pageSize = req.query.page_size || req.query.pageSize;

  try {
    const result = getAllAccounts(
      platform_id ? Number(platform_id) : undefined,
      status as string | undefined,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20
    );

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
    const account = getAccountById(Number(id));

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({
      success: true,
      data: account,
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
    const account = createAccount(req.body);

    res.status(201).json({
      success: true,
      data: account,
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
    const account = updateAccount(Number(id), req.body);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = deleteAccount(Number(id));

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

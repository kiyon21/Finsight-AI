import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  constructor(private userService: UserService) {}

  // Goal endpoints
  async addGoal(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const goal = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const goalId = await this.userService.addGoal(uid, goal);
      res.status(201).json({ 
        message: 'Goal added successfully',
        goalId 
      });
    } catch (error: any) {
      console.error('Add goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to add goal' });
    }
  }

  async getGoals(req: Request, res: Response) {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const goals = await this.userService.getGoals(uid);
      res.json(goals);
    } catch (error: any) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: error.message || 'Failed to get goals' });
    }
  }

  async deleteGoal(req: Request, res: Response) {
    try {
      const { uid, goalId } = req.params;

      if (!uid || !goalId) {
        return res.status(400).json({ error: 'User ID and Goal ID are required' });
      }

      await this.userService.deleteGoal(uid, goalId);
      res.json({ message: 'Goal deleted successfully' });
    } catch (error: any) {
      console.error('Delete goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete goal' });
    }
  }

  async updateGoal(req: Request, res: Response) {
    try {
      const { uid, goalId } = req.params;
      const goal = req.body;

      if (!uid || !goalId) {
        return res.status(400).json({ error: 'User ID and Goal ID are required' });
      }

      await this.userService.updateGoal(uid, goalId, goal);
      res.json({ message: 'Goal updated successfully' });
    } catch (error: any) {
      console.error('Update goal error:', error);
      res.status(500).json({ error: error.message || 'Failed to update goal' });
    }
  }

  // Income endpoints
  async addIncomeSource(req: Request, res: Response) {
    try {
      const { uid } = req.params;
      const income = req.body;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const incomeId = await this.userService.addIncomeSource(uid, income);
      res.status(201).json({ 
        message: 'Income source added successfully',
        incomeId 
      });
    } catch (error: any) {
      console.error('Add income source error:', error);
      res.status(500).json({ error: error.message || 'Failed to add income source' });
    }
  }

  async getIncomeSources(req: Request, res: Response) {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const incomeSources = await this.userService.getIncomeSources(uid);
      res.json(incomeSources);
    } catch (error: any) {
      console.error('Get income sources error:', error);
      res.status(500).json({ error: error.message || 'Failed to get income sources' });
    }
  }

  async deleteIncomeSource(req: Request, res: Response) {
    try {
      const { uid, incomeId } = req.params;

      if (!uid || !incomeId) {
        return res.status(400).json({ error: 'User ID and Income ID are required' });
      }

      await this.userService.deleteIncomeSource(uid, incomeId);
      res.json({ message: 'Income source deleted successfully' });
    } catch (error: any) {
      console.error('Delete income source error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete income source' });
    }
  }

  async updateIncomeSource(req: Request, res: Response) {
    try {
      const { uid, incomeId } = req.params;
      const income = req.body;

      if (!uid || !incomeId) {
        return res.status(400).json({ error: 'User ID and Income ID are required' });
      }

      await this.userService.updateIncomeSource(uid, incomeId, income);
      res.json({ message: 'Income source updated successfully' });
    } catch (error: any) {
      console.error('Update income source error:', error);
      res.status(500).json({ error: error.message || 'Failed to update income source' });
    }
  }
}


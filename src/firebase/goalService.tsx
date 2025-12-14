import { goalsAPI } from "../services/api";

export interface Goal {
    id?: string;
    goal_name: string,
    goal_type: string,
    goal_description: string,
    target_amount: string,
    current_amount: string,
    target_date: string,
    monthly_contribution: string,
    priority_level: string,
}

export const addGoal = async (uid: string, goal: Goal) => {
  try {
    const response = await goalsAPI.addGoal(uid, goal);
    console.log("Goal added with ID:", response.goalId);
    return response.goalId;
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
};

export const getGoals = async (uid: string): Promise<Goal[]> => {
  try {
    const goals = await goalsAPI.getGoals(uid);
    return goals;
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const deleteGoal = async (uid: string, goalId: string) => {
  try {
    await goalsAPI.deleteGoal(uid, goalId);
    console.log("Goal deleted with ID:", goalId);
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};

export const updateGoal = async (uid: string, goalId: string, goal: Partial<Goal>) => {
  try {
    await goalsAPI.updateGoal(uid, goalId, goal);
    console.log("Goal updated with ID:", goalId);
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};
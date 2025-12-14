import { incomeAPI } from "../services/api";

export interface IncomeSourceData {
    id?: string;
    sourceName: string;
    type: string;
    amount: string;
    currency: string;
    frequency: string;
    startDate: string;
    endDate: string;
    isTaxed: boolean;
    estimatedTaxRate: string;
    stability: string;
    confidenceRating: string;
    notes: string;
    isPrimary: boolean;
  }

export const addIncomeSource = async (uid: string, income: IncomeSourceData) => {
  try {
    const response = await incomeAPI.addIncomeSource(uid, income);
    console.log("Income added with ID:", response.incomeId);
    return response.incomeId;
  } catch (error) {
    console.error("Error adding income:", error);
    throw error;
  }
};

export const getIncomeSources = async (uid: string): Promise<IncomeSourceData[]> => {
  try {
    const incomeSources = await incomeAPI.getIncomeSources(uid);
    return incomeSources;
  } catch (error) {
    console.error('Error fetching income sources:', error);
    return [];
  }
};

export const deleteIncomeSource = async (uid: string, incomeId: string) => {
  try {
    await incomeAPI.deleteIncomeSource(uid, incomeId);
    console.log("Income deleted with ID:", incomeId);
  } catch (error) {
    console.error("Error deleting Income:", error);
    throw error;
  }
};

export const updateIncomeSource = async (uid: string, incomeId: string, income: Partial<IncomeSourceData>) => {
  try {
    await incomeAPI.updateIncomeSource(uid, incomeId, income);
    console.log("Income updated with ID:", incomeId);
  } catch (error) {
    console.error("Error updating income:", error);
    throw error;
  }
};
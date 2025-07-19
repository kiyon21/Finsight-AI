import { db } from "./firebase";
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";


export interface IncomeSourceData {
    id: string;
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
    const incomeRef = collection(db, "users", uid, "income");
    const docRef = await addDoc(incomeRef, income);
    console.log("Income added with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding goal:", error);
  }
};

export const deleteIncomeSource = async (uid: string, goalId: string) => {
  try {
    const incomeRef = doc(db, "users", uid, "income", goalId);
    await deleteDoc(incomeRef);
    console.log("Income deleted with ID:", goalId);
  } catch (error) {
    console.error("Error deleting Income:", error);
    throw error;
  }
};
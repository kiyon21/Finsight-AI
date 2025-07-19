import { db } from "./firebase";
import { collection, addDoc, doc, deleteDoc, getDocs } from "firebase/firestore";

export interface Goal {
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
    const goalRef = collection(db, "users", uid, "goals");
    const docRef = await addDoc(goalRef, goal);
    console.log("Goal added with ID:", docRef.id);
    return docRef.id; // Return the document ID for local state management
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
};

// export const getGoals = async (uid: string) => {
//   try {
//           const userId = uid;
//           const goalsRef = collection(doc(db, 'users', userId), 'goals');
//           const snapshot = await getDocs(goalsRef);
//           if (snapshot && !snapshot.empty) {
//             const goalsList: Goal[] = snapshot.docs.map(doc => ({
//               ...(doc.data() as Omit<Goal, 'goal_id'>),
//               goal_id: doc.id
//             }));
//             return goalsList;
//           }
//         } catch (error) {
//           return []
//           console.error('error fetching Goals', error);
//         }
// };

export const deleteGoal = async (uid: string, goalId: string) => {
  try {
    const goalRef = doc(db, "users", uid, "goals", goalId);
    await deleteDoc(goalRef);
    console.log("Goal deleted with ID:", goalId);
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};
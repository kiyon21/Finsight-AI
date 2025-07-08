import React from "react";
import type { StepsProps } from "../../pages/Onboarding";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase/firebase";
import {doc, updateDoc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Step5Complete = ({goNext, goBack}: StepsProps) => {

    const navigate = useNavigate();

    const handleFinish = async () => {
        
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userRef, {
            hasCompletedOnboarding:true,
        });
        } catch (err: any){
            console.log(err.message);
        }
        navigate('/home');        
    }

    return (
        <div>
          <h2>STEP 5 Complete</h2>
          <p>Let's get started on setting up your financial profile.</p>
          <button onClick={goBack}>Back</button>
          <button onClick={handleFinish}>Finish</button>
        </div>
      );
};

export default Step5Complete;
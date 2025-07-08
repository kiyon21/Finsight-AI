import React from "react";
import type { StepsProps } from "../../pages/Onboarding";

const Step3Goals = ({goNext, goBack}: StepsProps) => {
    return (
        <div>
          <h2>STEP 3 Goals!</h2>
          <p>Let's get started on setting up your financial profile.</p>
          <button onClick={goNext}>Next</button>
          <button onClick={goBack}>Back</button>
        </div>
      );
};

export default Step3Goals;
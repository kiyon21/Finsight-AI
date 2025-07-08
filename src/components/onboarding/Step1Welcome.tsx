import React from "react";
import type { StepsProps } from "../../pages/Onboarding";

const Step1Welcome = ({goNext}: StepsProps) => {
    return (
        <div>
          <h2>Welcome to FinSight!</h2>
          <p>Let's get started on setting up your financial profile.</p>
          <button onClick={goNext}>Next</button>
        </div>
      );
};

export default Step1Welcome;
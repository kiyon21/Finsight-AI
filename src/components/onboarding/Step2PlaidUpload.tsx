import React from "react";
import type { StepsProps } from "../../pages/Onboarding";

const Step2PlaidUpload = ({goNext, goBack}: StepsProps) => {

    return (
        <div>
          <h2>STEP 2 PLAID UPLOAD</h2>
          <p>Let's get started on setting up your financial profile.</p>
          <button onClick={goBack}>Back</button>
          <button onClick={goNext}>Next</button>
        </div>
      );

};

export default Step2PlaidUpload;
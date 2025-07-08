import React from "react";
import type { StepsProps } from "../../pages/Onboarding";

const Step4Income = ({goNext, goBack}: StepsProps) => {
    return (
        <div>
          <h2>STEP 4 Income!</h2>
          <p>Let's get started on setting up your financial profile.</p>
          <button onClick={goNext}>Next</button>
          <button onClick={goBack}>Back</button>
        </div>
      );
};

export default Step4Income;
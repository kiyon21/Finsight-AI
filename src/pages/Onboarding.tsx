import React, { useState } from "react";
import Step1Welcome from "../components/onboarding/Step1Welcome";
import Step2PlaidUpload from "../components/onboarding/Step2PlaidUpload";
import Step3Goals from "../components/onboarding/Step3Goals";
import Step4Income from "../components/onboarding/Step4Income";
import Step5Complete from "../components/onboarding/Step5Complete";
import ProgressBar from "../components/onboarding/ProgressBar";

// exported props for onboarding steps
export type StepsProps = {
    goNext: () => void;
    goBack?: () => void; 
}

// onboarding steps
const steps = [
    Step1Welcome,
    Step2PlaidUpload,
    Step3Goals,
    Step4Income,
    Step5Complete,
];

const Onboarding = () => {
    // useState for setting current step
    const [step, setStep] = useState(0);

    // setting next and prev steps
    const goNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
    const goBack = () => setStep((prev) => Math.max(prev - 1, 0));

    // set current Step
    const CurrentStep = steps[step];

    return (
        <div>
            <ProgressBar current={step + 1} total ={steps.length} />
            <CurrentStep goNext={goNext} {...(step > 0 && {goBack})} />
        </div>
    );
};

export default Onboarding;
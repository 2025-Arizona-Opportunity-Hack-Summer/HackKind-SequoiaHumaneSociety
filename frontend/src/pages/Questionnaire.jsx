import { useState } from "react";
import QuestionnaireStep1 from "../components/QuestionnaireStep1";
import QuestionnaireStep2 from "../components/QuestionnaireStep2";
import QuestionnaireStep3 from "../components/QuestionnaireStep3";
import QuestionnaireStep4 from "../components/QuestionnaireStep4";
import { useNavigate } from "react-router-dom";


export default function Questionnaire() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const navigate = useNavigate();

  const handleSubmit = () => {
    console.log("Final form data:", formData);
    // TODO: send to backend here
    navigate("/signup");  // 👈 redirect after submit
  };
  

  return (
    <div>
      {step === 1 && (
        <QuestionnaireStep1 onNext={() => setStep(2)} formData={formData} setFormData={setFormData} />
      )}
      {step === 2 && (
        <QuestionnaireStep2 onNext={() => setStep(3)} onBack={() => setStep(1)} formData={formData} setFormData={setFormData} />
      )}
      {step === 3 && (
        <QuestionnaireStep3 onNext={() => setStep(4)} onBack={() => setStep(2)} formData={formData} setFormData={setFormData} />
      )}
      {step === 4 && (
        <QuestionnaireStep4 onSubmit={handleSubmit} onBack={() => setStep(3)} formData={formData} setFormData={setFormData} />
      )}
    </div>
  );
}

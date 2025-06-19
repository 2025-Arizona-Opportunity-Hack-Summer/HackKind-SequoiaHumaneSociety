import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 text-center py-12 bg-gradient-to-b from-primary-white to-primary-blush/10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-charcoal mb-6 font-heading leading-tight">
          Find Your Perfect <span className="text-primary-red">Pet Match</span>
        </h1>
        <p className="text-lg md:text-xl text-primary-medium-gray max-w-2xl mx-auto mb-10 leading-relaxed">
          Using smart matchmaking, we connect you with pets that suit your lifestyle and preferences — all from our trusted shelter partners.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/signup")}
            className="btn btn-primary text-lg px-8 py-3 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">
        Find Your Perfect Pet Match
      </h1>
      <p className="text-gray-600 max-w-xl mb-8">
        Using smart matchmaking, we connect you with pets that suit your lifestyle and preferences — all from our trusted shelter partners.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate("/signup")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate("/login")}
          className="text-blue-600 font-semibold px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-100"
        >
          Login
        </button>
      </div>
    </div>
  );
}

import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";

function App() {
  const { user } = useContext(AuthContext);
  const [mode, setMode] = useState("login");

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold tracking-tight">
                Chat App
              </h1>
              <p className="text-sm text-slate-600">
                Sign in to start chatting.
              </p>
            </div>

            <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </div>

            {mode === "login" ? <Login /> : <Register />}
          </div>
        </div>
      </div>
    );
  }

  return <Chat />;
}

export default App;

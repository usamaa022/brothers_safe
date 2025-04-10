import { FaSignInAlt } from "react-icons/fa";

export default function Login({ handleLogin, loginError }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-black mb-4">Login</h2>
        {loginError && <p className="text-red-500 mb-4">{loginError}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-black mb-2">
              Email
            </label>
            <input
              type="email"
              id="username"
              name="username"
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-black mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <FaSignInAlt className="w-5 h-5" /> Login
          </button>
        </form>
      </div>
    </div>
  );
}
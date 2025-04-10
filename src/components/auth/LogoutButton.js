import { signOut } from "../../firebase";
import { FaSignOutAlt } from "react-icons/fa";

export default function LogoutButton({ onLogout }) {
  const handleLogout = () => {
    signOut(auth);
    onLogout();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-black hover:text-red-600"
    >
      <FaSignOutAlt className="w-5 h-5" /> Logout
    </button>
  );
}
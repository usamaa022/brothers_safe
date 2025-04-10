import LogoutButton from "../auth/LogoutButton";

export default function Header({ currentUser, isAdmin, onLogout }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-black">Monthly Safe Dashboard</h1>
        <p className="text-black">
          Welcome, {currentUser.displayName || currentUser.email}{" "}
          {isAdmin && "(Admin)"}
        </p>
      </div>
      <LogoutButton onLogout={onLogout} />
    </div>
  );
}
export default function HomePage() {
  const { user, logOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <header className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.email}</span>
            <button onClick={logOut} className="text-blue-400 hover:underline">
              Logout
            </button>
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Dashboard
            </Link>
          </div>
        ) : (
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        )}
      </header>
      {/* Rest of your page content stays the same */}
    </div>
  );
}

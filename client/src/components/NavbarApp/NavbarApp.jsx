const NavBarApp = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo Section */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">YarnFlow</h1>
          <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Admin</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-xl">⚙️</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👤</span>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBarApp
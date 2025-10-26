import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const SideBarApp = () => {
  const location = useLocation();
  const [masterDataOpen, setMasterDataOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "🏠"
    },
    {
      name: "Purchase Order (PO)",
      path: "/purchase-order",
      icon: "🛒"
    },
    {
      name: "Goods Receipt Note (GRN)",
      path: "/goods-receipt",
      icon: "📋"
    },
    {
      name: "Inventory Lots",
      path: "/inventory",
      icon: "📦"
    },
    {
      name: "Sales Order (SO)",
      path: "/sales-order",
      icon: "📄"
    },
    {
      name: "Sales Challan",
      path: "/sales-challan",
      icon: "🚚"
    }
  ];

  const masterDataItems = [
    {
      name: "Dashboard",
      path: "/master-data",
      icon: "🏠"
    },
    {
      name: "Customers",
      path: "/master-data/customers",
      icon: "👥"
    },
    {
      name: "Suppliers",
      path: "/master-data/suppliers",
      icon: "🏭"
    },
    {
      name: "Products",
      path: "/master-data/products",
      icon: "🧶"
    },
    {
      name: "Categories",
      path: "/master-data/categories",
      icon: "📂"
    }
  ];

  // Check if current path is within master data section
  const isMasterDataActive = location.pathname.startsWith('/master-data');
  
  // Auto-open master data dropdown if we're in that section
  useEffect(() => {
    if (isMasterDataActive) {
      setMasterDataOpen(true);
    }
  }, [isMasterDataActive]);

  return (
    <aside className="fixed left-0 top-16 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-40 overflow-hidden border-r border-gray-700">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 flex-shrink-0 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white mb-1">YarnFlow Admin</h2>
          <p className="text-xs text-gray-400">Management System</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`group flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white hover:transform hover:scale-102"
                    }`}
                  >
                    <span className="text-lg mr-3 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                </li>
              );
            })}
            
            {/* Master Data Dropdown */}
            <li className="mt-6">
              <div className="mb-2">
                <div className="flex items-center px-3 py-1">
                  <div className="flex-1 h-px bg-gray-700"></div>
                  <span className="px-2 text-xs text-gray-500 font-medium">MASTER DATA</span>
                  <div className="flex-1 h-px bg-gray-700"></div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                <button
                  onClick={() => setMasterDataOpen(!masterDataOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    isMasterDataActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">🗂️</span>
                    <span className="text-sm font-semibold">Master Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMasterDataActive && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${
                        masterDataOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Enhanced Dropdown Menu */}
                <div className={`overflow-hidden transition-all duration-300 ${
                  masterDataOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}>
                  <div className="px-2 pb-2">
                    <ul className="space-y-1">
                      {masterDataItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        
                        return (
                          <li key={item.path} 
                              className={`transform transition-all duration-200 ${
                                masterDataOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                              }`}
                              style={{ transitionDelay: `${index * 50}ms` }}>
                            <Link
                              to={item.path}
                              className={`group flex items-center px-4 py-2.5 rounded-md transition-all duration-200 text-sm relative ${
                                isActive
                                  ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md transform scale-105"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white hover:transform hover:scale-102"
                              }`}
                            >
                              {/* Connection Line */}
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-600 group-hover:bg-orange-400 transition-colors duration-200"></div>
                              
                              <span className="text-base mr-3 group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                              <span className="font-medium">{item.name}</span>
                              
                              {/* Active Indicator */}
                              {isActive && (
                                <div className="ml-auto flex items-center space-x-1">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  <div className="w-1 h-1 bg-white/70 rounded-full"></div>
                                </div>
                              )}
                              
                              {/* Hover Effect */}
                              {!isActive && (
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SideBarApp;
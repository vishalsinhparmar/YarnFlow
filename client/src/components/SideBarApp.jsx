import { Link, useLocation } from "react-router-dom";

const SideBarApp = () => {
  const location = useLocation();

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
    },
    {
      name: "Master Data",
      path: "/master-data",
      icon: "🗂️"
    }
  ];

  return (
    <aside className="fixed left-0 top-16 h-full w-64 bg-gray-900 text-white shadow-lg z-40">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-6">YarnFlow Admin</h2>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
export default SideBarApp;
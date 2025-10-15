import { Outlet } from "react-router-dom";
import NavBarApp from "../components/NavbarApp/NavbarApp";
import SideBarApp from "../components/SideBarApp/SideBarApp";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <NavBarApp/>
      
      {/* Sidebar */}
      <SideBarApp/>
      
      {/* Main Content Area */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
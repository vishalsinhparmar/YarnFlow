import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import TestComponent from "./components/TestComponents";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import PurchaseOrder from "./pages/PurchaseOrder";
import GoodsReceipt from "./pages/GoodsReceipt";
import Inventory from "./pages/Inventory";
import SalesOrder from "./pages/SalesOrder";
import SalesChallan from "./pages/SalesChallan";
import MasterDataDashboard from "./pages/MasterDataDashboard";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ProductsPage from "./pages/ProductsPage";
import CategoriesPage from "./pages/CategoriesPage";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Main Layout with nested routes */}
        <Route path="/" element={<Layout />}>
          {/* Default route - Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="purchase-order" element={<PurchaseOrder />} />
          <Route path="goods-receipt" element={<GoodsReceipt />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales-order" element={<SalesOrder />} />
          <Route path="sales-challan" element={<SalesChallan />} />
          <Route path="master-data" element={<MasterDataDashboard />} />
          <Route path="master-data/customers" element={<CustomersPage />} />
          <Route path="master-data/suppliers" element={<SuppliersPage />} />
          <Route path="master-data/products" element={<ProductsPage />} />
          <Route path="master-data/categories" element={<CategoriesPage />} />
        </Route>

        {/* Test route outside main layout */}
        <Route path="/test" element={<TestComponent />} />
      </Routes>
    </Router>
  );
};

export default App;
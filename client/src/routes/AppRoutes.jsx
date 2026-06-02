import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from '../components/layout/Layout';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';

// Public / store pages
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderConfirmation from '../pages/OrderConfirmation';
import Wishlist from '../pages/Wishlist';
import Compare from '../pages/Compare';
import NotFound from '../pages/NotFound';

// Auth pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';

// Account pages
import AccountLayout from '../pages/account/AccountLayout';
import Profile from '../pages/account/Profile';
import Orders from '../pages/account/Orders';
import OrderDetail from '../pages/account/OrderDetail';
import Addresses from '../pages/account/Addresses';
import ChangePassword from '../pages/account/ChangePassword';

// Admin pages
import AdminLayout from '../pages/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AddEditProduct from '../pages/admin/AddEditProduct';
import AdminOrders from '../pages/admin/Orders';
import AdminOrderDetail from '../pages/admin/OrderDetail';
import AdminUsers from '../pages/admin/Users';
import AdminUserDetail from '../pages/admin/UserDetail';
import AdminCategories from '../pages/admin/Categories';
import AdminCoupons from '../pages/admin/Coupons';
import AdminReviews from '../pages/admin/Reviews';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth (standalone, no store chrome) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Store (with navbar + footer) */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/compare" element={<Compare />} />

        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/order-confirmation/:id"
          element={
            <PrivateRoute>
              <OrderConfirmation />
            </PrivateRoute>
          }
        />

        {/* Account */}
        <Route
          path="/account"
          element={
            <PrivateRoute>
              <AccountLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AddEditProduct />} />
        <Route path="products/:id/edit" element={<AddEditProduct />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

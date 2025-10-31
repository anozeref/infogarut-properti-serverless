// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import Properti from './pages/Properti/Properti.jsx';
import PropertiDetail from './pages/PropertiDetail/PropertiDetail.jsx';
import DashboardAdmin from './pages/admin/DashboardAdmin.jsx';
import DashboardUser from './pages/user/DashboardUser.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

import "sweetalert2/dist/sweetalert2.min.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "properti", element: <Properti /> },
      { path: "properti/:id", element: <PropertiDetail /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  { path: "/admin/*", element: <DashboardAdmin /> },
  { path: "/user/*", element: <DashboardUser /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* 🔹 Bungkus AuthProvider */}
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

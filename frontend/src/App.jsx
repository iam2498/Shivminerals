import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

import Home from './pages/Home';
import TruckLoad from './pages/TruckLoad';
import PaymentIn from './pages/PaymentIn';
import Parties from './pages/Parties';
import ReportsHub from './pages/ReportsHub';
import PartyStatement from './pages/PartyStatement';
import VehicleReport from './pages/VehicleReport';
import DaywiseReport from './pages/DaywiseReport';
import Employees from './pages/Employees';
import EmployeeStatement from './pages/EmployeeStatement';
import Expenses from './pages/Expenses';

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <HashRouter>
          <Header />
          <main id="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/load" element={<TruckLoad />} />
              <Route path="/pay" element={<PaymentIn />} />
              <Route path="/parties" element={<Parties />} />
              <Route path="/rep" element={<ReportsHub />} />
              <Route path="/stmt" element={<PartyStatement />} />
              <Route path="/stmt/:id" element={<PartyStatement />} />
              <Route path="/veh" element={<VehicleReport />} />
              <Route path="/day" element={<DaywiseReport />} />
              <Route path="/emp" element={<Employees />} />
              <Route path="/empst" element={<EmployeeStatement />} />
              <Route path="/empst/:id" element={<EmployeeStatement />} />
              <Route path="/exp" element={<Expenses />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </HashRouter>
      </ToastProvider>
    </I18nProvider>
  );
}

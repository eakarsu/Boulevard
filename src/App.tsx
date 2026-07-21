import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import TimelineView from './pages/TimelineView';

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Calendar from '@/pages/Calendar'
import Clients from '@/pages/Clients'
import Services from '@/pages/Services'
import Staff from '@/pages/Staff'
import Settings from '@/pages/Settings'
import BookingWidget from '@/pages/BookingWidget'
import Analytics from '@/pages/Analytics'
import Payments from '@/pages/Payments'
import Notifications from '@/pages/Notifications'
import FeatureAudit from '@/pages/FeatureAudit'
import FeatureDemo from '@/pages/FeatureDemo'
import AITools from '@/pages/AITools'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/book/:businessId" element={<BookingWidget />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/services" element={<Services />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/features" element={<FeatureAudit />} />
        <Route path="/features/:featureId" element={<FeatureDemo />} />
        <Route path="/ai" element={<AITools />} />
        <Route path="/book/:businessId" element={<BookingWidget />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

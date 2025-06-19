import React from 'react'
import { useParams } from 'react-router-dom'

export default function BookingWidget() {
  const { businessId } = useParams()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Book Appointment</h2>
            <p className="text-sm text-gray-500">Business ID: {businessId}</p>
          </div>
          <div className="card-body">
            <p className="text-gray-500">Booking widget coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

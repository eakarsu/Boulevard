import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { featureConfigs, categoryLabels, categoryColors } from '../data/featureConfig'

export default function FeatureAudit() {
  const navigate = useNavigate()

  const handleCardClick = (feature: typeof featureConfigs[0]) => {
    if (feature.redirectTo) {
      navigate(feature.redirectTo)
    } else {
      navigate(`/features/${feature.id}`)
    }
  }

  // Group features by category
  const grouped = featureConfigs.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = []
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, typeof featureConfigs>)

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Feature Audit</h1>
            <p className="mt-1 text-sm text-gray-500">
              15 features that are intentionally not implemented in this demo application.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-amber-700 font-medium">
              {featureConfigs.length} Missing Features
            </span>
          </div>
        </div>

        {Object.entries(grouped).map(([category, features]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category]}`}>
                {categoryLabels[category]}
              </span>
              <span className="text-sm text-gray-400">({features.length} features)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div
                    key={feature.id}
                    onClick={() => handleCardClick(feature)}
                    className="card cursor-pointer hover:shadow-lg hover:border-red-300 transition-all duration-200 group"
                  >
                    <div className="card-body">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                          <Icon className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {feature.name}
                            </h3>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Missing
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {feature.description}
                          </p>
                          {feature.redirectTo && (
                            <p className="text-xs text-primary-500 mt-1">
                              Redirects to {feature.redirectTo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

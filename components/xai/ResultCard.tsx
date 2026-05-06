'use client'
// components/xai/ResultCard.tsx

interface Props {
  predictedClass: string
  confidence:     number
  probabilities:  Record<string, number>
}

const CLASS_COLORS: Record<string, string> = {
  glioma:     'text-red-400',
  meningioma: 'text-yellow-400',
  no_tumor:   'text-green-400',
  pituitary:  'text-blue-400',
}

const CLASS_LABELS: Record<string, string> = {
  glioma:     'Glioma',
  meningioma: 'Meningioma',
  no_tumor:   'No Tumour',
  pituitary:  'Pituitary',
}

const BAR_COLORS: Record<string, string> = {
  glioma:     'bg-red-500',
  meningioma: 'bg-yellow-500',
  no_tumor:   'bg-green-500',
  pituitary:  'bg-blue-500',
}

export function ResultCard({ predictedClass, confidence, probabilities }: Props) {
  const label = CLASS_LABELS[predictedClass] ?? predictedClass
  const color = CLASS_COLORS[predictedClass] ?? 'text-white'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      {/* Prediction headline */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Classification Result
          </p>
          <p className={`text-3xl font-bold ${color}`}>{label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Confidence
          </p>
          <p className="text-3xl font-bold text-white">
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Probability bars */}
      <div className="space-y-2 pt-2">
        {Object.entries(probabilities)
          .sort(([, a], [, b]) => b - a)   // highest first
          .map(([cls, prob]) => (
            <div key={cls}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{CLASS_LABELS[cls] ?? cls}</span>
                <span>{(prob * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${BAR_COLORS[cls] ?? 'bg-gray-500'} transition-all`}
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
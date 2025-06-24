import React from 'react'
import { Slider } from 'radix-ui'

interface MoodSliderProps {
  label: string
  value: number
  onValueChange: (value: number) => void
  leftIcon: React.ReactNode
  rightIcon: React.ReactNode
  rightLabel: string
  ariaLabel: string
}

const MoodSlider: React.FC<MoodSliderProps> = ({
  label,
  value,
  onValueChange,
  leftIcon,
  rightIcon,
  rightLabel,
  ariaLabel,
}) => {
  return (
    <div className="flex items-center w-64 min-w-[20rem] max-w-full px-4 py-2 bg-violet-200 rounded-full">
      {/* Left label & icon */}
      <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
        <div className="w-2.5 h-2.5 flex items-center justify-center">{leftIcon}</div>
        <span className="text-left text-xs whitespace-nowrap text-gray-600">{label}</span>
      </div>
      {/* Slider */}
      <Slider.Root
        value={[value]}
        onValueChange={(values) => onValueChange(values[0])}
        min={-1}
        max={1}
        step={0.1}
        className="relative flex items-center select-none touch-none flex-1 h-5 mx-3"
      >
        <Slider.Track className="bg-violet-400 relative grow rounded-full h-1.5">
          {value !== 0 && (
            <div
              className="absolute bg-violet-500 rounded-full h-full"
              style={{
                left: value < 0 ? `${50 + value * 50}%` : '50%',
                right: value > 0 ? `${50 - value * 50}%` : '50%',
              }}
            />
          )}
        </Slider.Track>
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-2.5 bg-gray-400 pointer-events-none z-10"
          style={{ left: '50%', marginLeft: '-1px' }}
        />
        <Slider.Thumb
          className="block w-2.5 h-2.5 bg-white border border-violet-400 rounded-full shadow-sm hover:bg-violet-50 focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors cursor-pointer relative z-20"
          aria-label={ariaLabel}
        />
      </Slider.Root>
      {/* Right label & icon */}
      <div className="flex items-center gap-1.5 w-24 flex-shrink-0 justify-end">
        <span className="text-right text-xs whitespace-nowrap text-gray-600">{rightLabel}</span>
        <div className="w-2.5 h-2.5 flex items-center justify-center">{rightIcon}</div>
      </div>
    </div>
  )
}

export default MoodSlider

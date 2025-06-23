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
    <div className="flex items-center justify-between text-xs text-gray-500">
      <div className="flex items-center gap-1.5 w-14">
        <div className="w-2.5 h-2.5 flex items-center justify-center">{leftIcon}</div>
        <span className="text-left text-xs">{label}</span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={(values) => onValueChange(values[0])}
        min={-1}
        max={1}
        step={0.1}
        className="relative flex items-center select-none touch-none w-80 h-5 mx-4"
      >
        <Slider.Track className="bg-gray-300 relative grow rounded-full h-1.5">
          {value !== 0 && (
            <div
              className="absolute bg-violet-400 rounded-full h-full"
              style={{
                left: value < 0 ? `${50 + value * 50}%` : '50%',
                right: value > 0 ? `${50 - value * 50}%` : '50%',
              }}
            />
          )}
        </Slider.Track>
        {/* Center indicator */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-2.5 bg-gray-400 pointer-events-none z-10"
          style={{ left: '50%', marginLeft: '-1px' }}
        />
        <Slider.Thumb
          className="block w-2.5 h-2.5 bg-white border border-violet-400 rounded-full shadow-sm hover:bg-violet-50 focus:outline-none focus:ring-1 focus:ring-violet-300 transition-colors cursor-pointer relative z-20"
          aria-label={ariaLabel}
        />
      </Slider.Root>
      <div className="flex items-center gap-1.5 w-14 justify-end">
        <span className="text-right text-xs">{rightLabel}</span>
        <div className="w-2.5 h-2.5 flex items-center justify-center">{rightIcon}</div>
      </div>
    </div>
  )
}

export default MoodSlider

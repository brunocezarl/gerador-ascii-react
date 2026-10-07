import { useId } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  // Texto mostrado no lugar do valor bruto (ex.: com casas decimais)
  display?: string;
  onChange: (value: number) => void;
}

const Slider = ({ label, value, min, max, step, display, onChange }: SliderProps) => {
  const id = useId();

  return (
    <>
      <div className="slider-control">
        <label htmlFor={id}>{label}</label>
        <span>{display ?? value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </>
  );
};

export default Slider;

import { forwardRef, type InputHTMLAttributes } from "react";
import "./controls.css";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} {...props} className={`ks-input ${className}`.trim()} />
  )
);

TextField.displayName = "TextField";

export default TextField;

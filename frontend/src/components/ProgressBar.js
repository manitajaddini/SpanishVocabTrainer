import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
const ProgressBar = ({ value, max }) => {
    const percentage = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
    return (_jsx("div", { className: "h-2 w-full rounded-full bg-slate-800", role: "progressbar", "aria-valuenow": percentage, "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { className: clsx('h-2 rounded-full bg-sky-500 transition-all duration-300 ease-out'), style: { width: `${percentage}%` } }) }));
};
export default ProgressBar;

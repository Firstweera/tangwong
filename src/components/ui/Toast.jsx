// Toast.jsx — useToast hook + inline toast node
import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, icon) => {
    setToast({ msg, icon });
    clearTimeout(show._t);
    show._t = setTimeout(() => setToast(null), 1900);
  };
  const node = toast && (
    <div className="toast" key={toast.msg}>
      {toast.icon && <span style={{ fontSize: 15 }}>{toast.icon}</span>}
      <span>{toast.msg}</span>
    </div>
  );
  return [node, show];
}

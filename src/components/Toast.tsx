import { useToastStore } from '../stores/toastStore';
import { CheckIcon, AlertIcon, InfoIcon, XIcon } from '../icons';

const icons = {
  success: { Icon: CheckIcon, color: '#00E676', bg: 'bg-accent/15 border-accent/30' },
  error: { Icon: AlertIcon, color: '#FF5252', bg: 'bg-danger/15 border-danger/30' },
  info: { Icon: InfoIcon, color: '#60A5FA', bg: 'bg-blue-400/15 border-blue-400/30' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color, bg } = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm animate-toast-in ${bg}`}
          >
            <Icon size={18} color={color} />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="p-0.5 opacity-60">
              <XIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

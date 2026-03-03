import { Button } from './Button';
import { useTranslation } from '../i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-6 animate-fade-in" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm border border-border animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-text-secondary text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onCancel}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            fullWidth
            onClick={onConfirm}
            className={danger ? '!bg-danger !text-white' : ''}
          >
            {confirmLabel || t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface ToastMessage {
  message: string;
  error: boolean;
}

export function Toast({ value, onClose }: { value: ToastMessage; onClose: () => void }) {
  return (
    <div
      className={`toast ${value.error ? 'toast-error' : ''}`}
      role={value.error ? 'alert' : 'status'}
    >
      <span>{value.message}</span>
      <button aria-label="Fechar aviso" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

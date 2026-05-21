import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure?',
    confirmLabel = 'Confirm',
    variant = 'primary',
    loading = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant={variant} onClick={onConfirm} loading={loading}>
                        {loading ? 'Processing...' : confirmLabel}
                    </Button>
                </>
            }
        >
            <p className="text-sm text-[#5C6B88]">{message}</p>
        </Modal>
    );
}

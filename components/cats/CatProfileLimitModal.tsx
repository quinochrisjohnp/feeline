import ConfirmModal from "@/components/common/ConfirmModal";
import { CAT_PROFILE_LIMIT_MESSAGE } from "@/constants/catLimits";

export default function CatProfileLimitModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return <ConfirmModal visible={visible} title="Cat profile limit reached" message={CAT_PROFILE_LIMIT_MESSAGE}
    hideCancel confirmLabel="Got it" onConfirm={onClose} onCancel={onClose} />;
}

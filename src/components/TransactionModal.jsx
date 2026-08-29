import useIsMobile from "../hooks/useIsMobile";
import TransactionForm from "./TransactionForm";
import TransactionFormMobile from "./TransactionFormMobile";

/**
 * Same props as TransactionForm/TransactionFormMobile
 * (onClose, onSave, onDelete, initialValues). Renders whichever
 * version fits the viewport, so call sites never branch on it.
 */
export default function TransactionModal(props) {
  const isMobile = useIsMobile();
  return isMobile ? <TransactionFormMobile {...props} /> : <TransactionForm {...props} />;
}
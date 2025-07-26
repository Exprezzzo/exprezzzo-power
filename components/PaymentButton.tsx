// /components/PaymentButton.tsx
export interface PaymentButtonProps {
  priceId: string;
  buttonText: string;  // This was missing
  className?: string;
  disabled?: boolean;
  customerEmail?: string;
}
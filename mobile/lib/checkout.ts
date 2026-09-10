export type CheckoutForm = {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
};

export function validateCheckout(form: CheckoutForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.first_name.trim()) errors.first_name = "Required";
  if (!form.last_name.trim()) errors.last_name = "Required";
  if (!form.phone.trim()) errors.phone = "Required";
  if (!form.address.trim()) errors.address = "Required";
  return errors;
}
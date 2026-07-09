export function buildGuestOrderLookupInitialForm(searchParams: {
  orderNumber: string | null;
  email: string | null;
}) {
  return {
    orderNumber: searchParams.orderNumber?.trim() ?? "",
    email: searchParams.email?.trim() ?? "",
  };
}

export function canSubmitGuestOrderLookup(form: {
  orderNumber: string;
  email: string;
}): boolean {
  return Boolean(form.orderNumber.trim() && form.email.trim());
}

export function shouldAutoLookupGuestOrder(searchParams: {
  orderNumber: string | null;
  email: string | null;
}): boolean {
  return canSubmitGuestOrderLookup(
    buildGuestOrderLookupInitialForm(searchParams),
  );
}

/** Sends the buyer to a hosted gateway page. Gateways like JazzCash/PayFast need a signed form POST, not a plain redirect. */
export function goToGateway(redirectUrl: string, formFields?: Record<string, string>): void {
  if (!formFields || Object.keys(formFields).length === 0) {
    window.location.href = redirectUrl;
    return;
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = redirectUrl;
  form.style.display = 'none';
  for (const [name, value] of Object.entries(formFields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

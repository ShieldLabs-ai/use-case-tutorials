import { identifyOnFirstFocus } from './shieldlabs.js';
const form = document.querySelector('#checkoutForm');
const output = document.querySelector('#result');
const identification = identifyOnFirstFocus(form);
form.addEventListener('submit', async event => {
  event.preventDefault(); const button=form.querySelector('button'); button.disabled=true;
  try {
    const requestId = await identification.take();
    const response = await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:form.elements.email.value,requestId})});
    const data=await response.json(); output.textContent=data.message;
  } catch { output.textContent='The demo could not complete this action.'; } finally { button.disabled=false; }
});
document.querySelector('#resetDb').addEventListener('click', async () => {const response=await fetch('/api/reset-db',{method:'POST'});output.textContent=(await response.json()).message;});

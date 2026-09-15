function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 });
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const password = process.env.SHOPIFY_STOREFRONT_PASSWORD;

  if (!domain || !password) {
    return Response.json(
      { error: 'Set SHOPIFY_STOREFRONT_PASSWORD in .env.local for local development.' },
      { status: 500 },
    );
  }

  const shopifyPasswordUrl = `https://${domain}/password`;
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Unlocking Shopify storefront</title></head>
  <body>
    <p>Unlocking Shopify storefront...</p>
    <form id="shopify-password" method="post" action="${escapeHtml(shopifyPasswordUrl)}">
      <input type="hidden" name="form_type" value="storefront_password">
      <input type="hidden" name="utf8" value="&#10003;">
      <input type="hidden" name="password" value="${escapeHtml(password)}">
      <input type="hidden" name="commit" value="Enter">
    </form>
    <script>document.getElementById('shopify-password').submit()</script>
  </body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
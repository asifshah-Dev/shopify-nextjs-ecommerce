import { shopifyFetch } from '@/lib/shopify';

interface CheckoutItem {
  variantId: string;
  quantity: number;
}

const cartCreateMutation = `
  mutation cartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: CheckoutItem[] };
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    const lines = items.map((item) => {
      if (
        typeof item.variantId !== 'string' ||
        item.variantId.length === 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        throw new Error('Invalid cart item.');
      }

      return {
        merchandiseId: item.variantId,
        quantity: item.quantity,
      };
    });

    const result = await shopifyFetch(cartCreateMutation, { lines });
    const cartCreate = result.data?.cartCreate;
    const userError = cartCreate?.userErrors?.[0];

    if (userError || !cartCreate?.cart?.checkoutUrl) {
      return Response.json(
        { error: userError?.message || 'Shopify could not create the checkout.' },
        { status: 502 },
      );
    }

    return Response.json({ checkoutUrl: cartCreate.cart.checkoutUrl });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to start checkout.' },
      { status: 400 },
    );
  }
}
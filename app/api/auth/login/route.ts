import { cookies } from 'next/headers';
import { shopifyFetch } from '@/lib/shopify';

const customerLoginMutation = `
  mutation customerLogin($email: String!, $password: String!) {
    customerAccessTokenCreate(input: { email: $email, password: $password }) {
      customerAccessToken {
        accessToken
        expiresAt
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
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const result = await shopifyFetch(customerLoginMutation, { email, password });
    const login = result.data?.customerAccessTokenCreate;
    const userError = login?.userErrors?.[0];

    if (userError || !login?.customerAccessToken) {
      return Response.json(
        { error: userError?.message || 'Invalid email or password.' },
        { status: 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('shopify_customer_token', login.customerAccessToken.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Customer login failed:', error);
    return Response.json({ error: 'Unable to sign in right now.' }, { status: 500 });
  }
}
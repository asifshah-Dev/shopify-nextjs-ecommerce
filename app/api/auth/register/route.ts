import { shopifyFetch } from '@/lib/shopify';

const customerCreateMutation = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!firstName || !lastName || !email || !password) {
      return Response.json({ error: 'Please complete all fields.' }, { status: 400 });
    }

    if (password.length < 5) {
      return Response.json({ error: 'Password must be at least 5 characters.' }, { status: 400 });
    }

    const result = await shopifyFetch(customerCreateMutation, {
      input: { firstName, lastName, email, password },
    });
    const registration = result.data?.customerCreate;
    const userError = registration?.customerUserErrors?.[0];

    if (userError || !registration?.customer) {
      return Response.json(
        { error: userError?.message || 'Unable to create your account.' },
        { status: 400 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Customer registration failed:', error);
    return Response.json({ error: 'Unable to create your account right now.' }, { status: 500 });
  }
}
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify';
import AccountActions from '@/components/AccountActions';

const customerQuery = `
  query getCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      email
      numberOfOrders
    }
  }
`;

export default async function AccountPage() {
  const token = (await cookies()).get('shopify_customer_token')?.value;
  if (!token) redirect('/login');

  const result = await shopifyFetch(customerQuery, { customerAccessToken: token });
  const customer = result.data?.customer;
  if (!customer) redirect('/login');

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-zinc-500">Your account</p>
            <h1 className="mt-2 text-4xl font-bold text-zinc-900">Welcome, {customer.firstName || 'there'}.</h1>
            <p className="mt-2 text-zinc-500">{customer.email}</p>
          </div>
          <AccountActions />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-500">Orders placed</p>
            <p className="mt-3 text-3xl font-bold text-zinc-900">{customer.numberOfOrders}</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-6 text-white shadow-sm">
            <p className="text-sm text-zinc-400">Shopping status</p>
            <p className="mt-3 text-xl font-semibold">Ready for your next order</p>
          </div>
        </div>
      </div>
    </main>
  );
}
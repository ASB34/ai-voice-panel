import { getUserWithSubscription } from '@/lib/db/queries';

export async function GET() {
  const userWithSubscription = await getUserWithSubscription();
  return Response.json(userWithSubscription);
}

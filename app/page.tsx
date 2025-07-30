import { redirect } from 'next/navigation';

export default function RootPage() {
  // Default redirect to English
  redirect('/en');
}

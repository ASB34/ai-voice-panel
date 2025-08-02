import { Suspense } from 'react';
import { Login } from '../login';

function LoginWrapper() {
  return <Login mode="signin" />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>}>
      <LoginWrapper />
    </Suspense>
  );
}

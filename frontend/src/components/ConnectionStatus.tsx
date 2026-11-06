import { useAsyncData } from '@/lib/useAsyncData';
import { testBackendConnection } from '@/services/connectionService';

export default function ConnectionStatus() {
  const connection = useAsyncData(testBackendConnection, []);

  const message = connection.isLoading
    ? 'Checking backend connection…'
    : connection.error
      ? `Backend connection unavailable. ${connection.error}`
      : connection.data?.message;

  return (
    <p
      role="status"
      className={`text-xs font-medium ${connection.error ? 'text-rose-700' : 'text-slate-500'}`}
    >
      {message}
    </p>
  );
}

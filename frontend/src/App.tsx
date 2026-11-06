import { AuthProvider } from '@/context/AuthContext';
import { PrescriptionProvider } from '@/context/PrescriptionContext';
import { RouterProvider } from '@/lib/router';
import AppRoutes from '@/routes';

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <PrescriptionProvider>
          <AppRoutes />
        </PrescriptionProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;

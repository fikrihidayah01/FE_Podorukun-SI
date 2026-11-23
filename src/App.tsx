import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import NotificationHost from './components/NotificationHost';
import { router } from './router';
import { useAuthStore } from './store/authStore';
import ToastContainer from './components/ui/ToastContainer';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <>
      <RouterProvider router={router} />
      <NotificationHost />
      <ToastContainer />
    </>
  );
}

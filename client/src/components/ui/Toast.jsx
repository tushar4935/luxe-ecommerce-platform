import toast from 'react-hot-toast';

/**
 * Thin wrapper around react-hot-toast so the rest of the app has a single
 * import surface for notifications. The <Toaster /> itself is mounted in
 * main.jsx with the dark/gold theme.
 */
export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  info: (msg) => toast(msg),
  promise: (promise, msgs) => toast.promise(promise, msgs),
  dismiss: () => toast.dismiss(),
};

export default notify;

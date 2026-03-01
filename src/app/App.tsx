import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastContainer } from "./components/ToastSystem";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

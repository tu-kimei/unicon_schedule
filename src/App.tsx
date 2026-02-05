import { Outlet } from "react-router-dom";
import "./App.css";
import { Layout } from "./shared/components/Layout";

export function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

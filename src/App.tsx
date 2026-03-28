import { Outlet } from "react-router-dom";
import "./App.css";
import { Layout } from "./shared/components/Layout";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

export function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

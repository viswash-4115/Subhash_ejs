import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ToastContainer } from "./components/Toast";
import { DashboardPage } from "./pages/DashboardPage";
import { ScheduleEmailPage } from "./pages/ScheduleEmailPage";
import { EmailDetailPage } from "./pages/EmailDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/schedule" element={<ScheduleEmailPage />} />
          <Route path="/email/:id" element={<EmailDetailPage />} />
        </Routes>
      </Layout>
      <ToastContainer />
    </BrowserRouter>
  );
}

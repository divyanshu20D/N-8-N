import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import MainLayout from "./layouts/MainLayout/MainLayout";
import WorkflowList from "./pages/WorkflowList/WorkflowList";
import WorkflowEditor from "./pages/WorkflowEditor/WorkflowEditor";
import Executions from "./pages/Executions/Executions";
import Incidents from "./pages/Incidents/Incidents";
import Credentials from "./pages/Credentials/Credentials";
import Marketplace from "./pages/Marketplace/Marketplace";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import PublicOnlyRoute from "./components/Auth/PublicOnlyRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <MainLayout>
                <Outlet />
              </MainLayout>
            }
          >
            <Route path="/" element={<WorkflowList />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/executions" element={<Executions />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/editor/:id" element={<WorkflowEditor />} />
            <Route path="/editor" element={<WorkflowEditor />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

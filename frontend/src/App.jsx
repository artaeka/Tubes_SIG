import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import InteractiveMap from "./components/InteractiveMap.jsx";
import RouteDetails from "./components/RouteDetails.jsx";
import AuthLoginComponent from "./components/AuthLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

export default function App() {
  const [tab, setTab] = useState("home");
  const [selectedRouteId, setSelectedRouteId] = useState("RT-003"); // Default to Tulungagung-Boyolangu
  const [adminUser, setAdminUser] = useState(null);

  // Auto load admin session state on boot from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("tulungagung-adm-session");
    if (cached) {
      try {
        setAdminUser(JSON.parse(cached));
      } catch (err) {
        console.error("Session parse error:", err);
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    localStorage.setItem("tulungagung-adm-session", JSON.stringify(user));
    setTab("admin"); // Redirect langsung ke Admin Panel
  };

  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem("tulungagung-adm-session");
    setTab("home");
  };

  const handleSelectRouteAndOpenDetail = (routeId) => {
    setSelectedRouteId(routeId);
    setTab("detail");
  };

  return (
    <div className="h-screen flex flex-col font-sans select-none bg-background text-on-surface overflow-hidden">
      {/* Universal Sticky Header Navigation */}
      <Navbar
        currentTab={tab}
        setTab={setTab}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Screen Layout Container */}
      <main className={`flex-1 mt-16 flex flex-col h-[calc(100vh-64px)] ${tab === "map" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {tab === "home" && (
          <Home setTab={setTab} isAdmin={!!adminUser} />
        )}

        {tab === "map" && (
          <InteractiveMap onSelectRoute={handleSelectRouteAndOpenDetail} />
        )}

        {tab === "detail" && (
          <RouteDetails
            selectedRouteId={selectedRouteId}
            onSelectRoute={setSelectedRouteId}
          />
        )}

        {tab === "login" && (
          <AuthLoginComponent
            onSuccess={handleLoginSuccess}
            onBack={() => setTab("home")}
          />
        )}

        {tab === "admin" && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}
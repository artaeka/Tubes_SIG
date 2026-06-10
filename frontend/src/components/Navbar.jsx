import React from "react";

export default function Navbar({ currentTab, setTab, adminUser, onLogout }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant shadow-sm h-16">
      <div className="flex justify-between items-center h-full px-gutter max-w-[1440px] mx-auto">
        <div className="flex items-center gap-md cursor-pointer" onClick={() => setTab("home")}>
          <span className="material-icons-outlined text-primary text-3xl font-bold align-middle">directions_bus</span>
          <span className="font-display text-xl md:text-2xl font-extrabold text-primary tracking-tight">
            Tulungagung Transit
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-lg">
          <button
            onClick={() => setTab("home")}
            className={`text-body-md font-medium pb-1 transition-all pointer-events-auto cursor-pointer ${
              currentTab === "home"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => setTab("map")}
            className={`text-body-md font-medium pb-1 transition-all pointer-events-auto cursor-pointer ${
              currentTab === "map"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Peta Rute
          </button>
          <button
            onClick={() => setTab("detail")}
            className={`text-body-md font-medium pb-1 transition-all pointer-events-auto cursor-pointer ${
              currentTab === "detail"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Detail Trayek
          </button>
        </nav>

        <div className="flex items-center gap-md">
          {adminUser ? (
            <div className="flex items-center gap-md">
              <button
                onClick={() => setTab("admin")}
                className={`flex items-center gap-xs px-md py-2 rounded-lg text-body-sm font-bold transition-all border ${
                  currentTab === "admin"
                    ? "bg-primary text-white border-primary"
                    : "bg-primary-fixed text-on-primary-fixed border-outline-variant hover:bg-opacity-85"
                }`}
              >
                <span className="material-icons-outlined text-sm">admin_panel_settings</span>
                Admin Panel
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-xs text-xs px-3 py-2 text-error hover:bg-error-container hover:text-error rounded-lg border border-transparent hover:border-error-container transition-all"
                title="Log Keluar"
              >
                <span className="material-icons-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTab("login")}
              className="bg-primary text-on-primary font-bold px-lg py-sm rounded-lg text-body-md hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <span className="material-icons-outlined text-sm">login</span>
              Login Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

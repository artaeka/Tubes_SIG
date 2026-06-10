import React, { useState } from "react";

export default function AuthLogin({ onSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.success) {
          onSuccess(data.user);
        } else {
          setErrorMsg(data.message);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setErrorMsg("Koneksi gagal! Silakan periksa jaringan server Anda.");
        console.error("Auth login error:", err);
      });
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-20 px-4 min-h-[calc(100vh-64px)] relative overflow-hidden map-pattern select-none">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale brightness-110">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8xuFdeD6EwStfBmAMLSmnzkSDsRMyNv9ive5L3V49sjFiR029KviVgsBnE9RkoLN2lICuX7ClWkeGCbo8R9JZFAClo_n2Pq6ZCLll-raaQl8Q-9MXXa4lIMWn0ab0kXh7WDhdRYgUji30RdCyZqZDR7aYHohd8_4CS9tC40OinV0sr5F153XpGPgSxD9FhyF6tG__8MNt_Yh9UPZPfzTn0o4lyOgoqdjSoKZVsiF9GeJl-IUqkfZQ4eoBQrX8jLItgL7e9mGZEmA"
          alt="Abstrak Map Layout"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="w-full max-w-[440px] bg-white border border-outline-variant shadow-2xl rounded-2xl z-10 p-xl flex flex-col gap-lg">
        <div className="text-center space-y-sm">
          <div className="flex justify-center mb-1">
            <span
              className="material-icons-outlined text-primary text-[48px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-primary tracking-tight">Tulungagung Transit</h1>
          <p className="text-[10px] font-mono text-on-surface-variant font-bold tracking-widest uppercase">
            DINAS PERHUBUNGAN KABUPATEN TULUNGAGUNG
          </p>
        </div>

        {errorMsg && (
          <div className="bg-error-container text-error text-xs font-semibold p-3 rounded-lg border border-error/20 flex gap-xs items-center leading-normal">
            <span className="material-icons-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div className="space-y-xs">
            <label className="text-xs font-bold text-on-surface-variant" htmlFor="username">
              Email atau Username
            </label>
            <div className="relative group">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                person
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan email Anda"
                className="w-full pl-[40px] pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs font-medium text-on-surface"
              />
            </div>
          </div>

          <div className="space-y-xs">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs font-bold text-primary hover:underline">
                Lupa Password?
              </a>
            </div>
            <div className="relative group">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                lock
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-[40px] pr-[44px] py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs font-mono text-on-surface"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer select-none"
              >
                <span className="material-icons-outlined text-base">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-primary-container text-white font-bold py-sm px-lg rounded-xl flex items-center justify-center gap-sm active:scale-95 transition-transform hover:bg-opacity-95 shadow-md cursor-pointer text-sm"
          >
            {isLoading ? (
              <>
                <span className="animate-spin material-icons-outlined text-base">progress_activity</span>
                Memproses...
              </>
            ) : (
              <>
                Login Admin
                <span className="material-icons-outlined text-base">login</span>
              </>
            )}
          </button>
        </form>

        <div className="relative py-1 flex items-center select-none">
          <div className="flex-grow border-t border-outline-variant"></div>
          <span className="flex-shrink mx-md text-xs text-on-surface-variant">atau</span>
          <div className="flex-grow border-t border-outline-variant"></div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-xs font-bold text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <span className="material-icons-outlined text-sm">arrow_back</span>
          Kembali ke Beranda
        </button>
      </div>

      <footer className="absolute bottom-4 text-center select-none">
        <p className="text-[10px] text-on-surface-variant opacity-75">
          © 2026 Dinas Perhubungan Kabupaten Tulungagung. Sistem Informasi Geografis Transportasi Publik.
        </p>
      </footer>
    </div>
  );
}
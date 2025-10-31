import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  // ❗Hanya sembunyikan layout di halaman login
  const hideLayout = location.pathname === "/login";

  return (
    <>
      {!hideLayout && <Header user={user} setUser={setUser} />}

      <main>
        <Outlet context={{ user, setUser }} />
      </main>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;

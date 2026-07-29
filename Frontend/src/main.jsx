import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SocketProvider } from "./contexts/SocketContext.jsx";
import { SessionProvider } from "./contexts/SessionProvider.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
);

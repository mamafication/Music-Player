const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldLogin = `  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup, silently ignore
        console.log("Login popup closed by user.");
      } else {
        console.error("Login failed", error);
        alert("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };`;

const newLogin = `  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User intentionally closed the popup, silently ignore
        console.log("Login popup closed by user.");
      } else {
        console.error("Login failed", error);
        // We avoid alert() due to iframe constraints, just logging is fine.
      }
    }
  };`;

code = code.replace(oldLogin, newLogin);
fs.writeFileSync('src/App.tsx', code);

const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(/Heart, /g, "");
app = app.replace(/LogIn, /g, "");
app = app.replace(/LogOut, /g, "");
app = app.replace(/PanelLeftClose, /g, "");
app = app.replace(/PanelLeftOpen, /g, "");
fs.writeFileSync('src/App.tsx', app);

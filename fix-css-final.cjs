const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace the complicated escaped selectors with clean semantic selectors
css = css.replace(/\.brutal input\[type="text"\],\s*\.brutal aside nav button,\s*\.brutal \.neo-card,\s*\.brutal \.fixed\.bottom-0 button\.bg-white,\s*\.brutal \.neo-modal {/g, '.brutal input[type="text"], \n  .brutal aside nav button, \n  .brutal .neo-card,\n  .brutal .fixed.bottom-0 button.bg-white,\n  .brutal .neo-modal {');

// Just to be absolutely sure the CSS is clean, let's rewrite that specific block completely:
const cssParts = css.split('/* Thick borders and hard shadows on primary interactive blocks */');
if (cssParts.length === 2) {
  const cssEnd = cssParts[1].split('/* Interaction states */');
  
  const newBlock = `
  .brutal input[type="text"], 
  .brutal aside nav button, 
  .brutal .neo-card,
  .brutal .fixed.bottom-0 button.bg-white,
  .brutal .neo-modal {
    background-color: var(--brutal-card) !important;
    border: 3px solid var(--brutal-border) !important;
    box-shadow: 4px 4px 0 0 var(--brutal-border) !important;
    transition: transform 0.1s, box-shadow 0.1s !important;
  }

  .brutal input[type="text"] {
    background-color: #fff !important;
  }
  
  `;
  
  const stateEnd = cssEnd[1].split('/* Special Accents */');
  const newState = `
  .brutal input[type="text"]:focus, 
  .brutal aside nav button:active, 
  .brutal .neo-card:active,
  .brutal .fixed.bottom-0 button.bg-white:active {
    transform: translate(2px, 2px) !important;
    box-shadow: 2px 2px 0 0 var(--brutal-border) !important;
  }

  .brutal aside nav button:hover, 
  .brutal .neo-card:hover {
    background-color: var(--brutal-card-hover) !important;
  }
  
  `;
  
  fs.writeFileSync('src/index.css', cssParts[0] + '/* Thick borders and hard shadows on primary interactive blocks */\n' + newBlock + '/* Interaction states */\n' + newState + '/* Special Accents */' + stateEnd[1]);
}


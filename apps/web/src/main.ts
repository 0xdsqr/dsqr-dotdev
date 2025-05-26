import * as hoot from "@dsqr-dotdev/hoot"

const element = hoot.createElement('div', { 
    style: 'padding: 20px; background: #f0f0f0; border-radius: 8px;' 
  },
    hoot.createElement('h1', { 
      style: 'color: #333; font-size: 2rem; margin-bottom: 1rem;' 
    }, 'Hello Mini React!'),
    
    hoot.createElement('p', { 
      style: 'color: #666; line-height: 1.5;' 
    }, 'Built with just createElement and render'),
    
    hoot.createElement('button', {
      style: 'background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;',
      onclick: () => alert('It works!')
    }, 'Click me')
  )
  
  
  const container = document.getElementById('app')
  if (!container) {
    throw new Error('could not find #app element')
  }
  hoot.render(element, container)
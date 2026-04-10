const { api } = require('./src/lib/api.ts'); console.log('Chat Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(m => m.toLowerCase().includes('chat')));

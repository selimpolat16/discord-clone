const NodeCache = require('node-cache');
const cache = new NodeCache({ 
    stdTTL: 1800,    // Önbellek süresi: 30 dakika
    checkperiod: 600 // Temizlik kontrolü: 10 dakika
});

module.exports = cache; 
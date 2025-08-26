const https = require('https');

function checkDeployment(url) {
  return new Promise((resolve, reject) => {
    https.get(`${url}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Deployment verified!');
          console.log(`Version: ${parsed.version.substring(0, 7)}`);
          console.log(`Deployed: ${parsed.deployedAt}`);
          console.log(`Cache: ${parsed.cache}`);
          resolve(true);
        } catch (e) {
          console.log('❌ Invalid response');
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const prodUrl = process.argv[2] || 'https://exprezzzo-power.vercel.app';
checkDeployment(prodUrl).catch(console.error);

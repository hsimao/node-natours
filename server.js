const dotenv = require('dotenv');

const configName = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
dotenv.config({ path: `${__dirname}/config/${configName}.env` });

const app = require('./app');

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App start on port ${port}...`);
});

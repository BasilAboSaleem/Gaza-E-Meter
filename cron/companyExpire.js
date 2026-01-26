const cron = require('node-cron');
const CompanyService = require('../app/services/super-admin/company');

// كل دقيقة (تقدر تغيّرها)
cron.schedule('59 23 * * *', async () => {
  try {
    await CompanyService.autoExpireCompanies();
  } catch (err) {
    console.error('Auto expire failed:', err);
  }
});

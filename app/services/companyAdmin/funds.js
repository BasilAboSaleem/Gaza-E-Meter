const fundRepo = require('../../repositories/companyAdmin/fund');

exports.getFundsByCompany = async (companyId) => {
    return await fundRepo.findByCompany(companyId);
};
const FileRepository = require("./FileRepository");

/** Reads and writes data/serviceRequests.json. */
class ServiceRequestFileRepository extends FileRepository {
  constructor(dataDir) {
    super(dataDir, "serviceRequests.json", "requestId");
  }

  async findByRequester(userId) {
    const records = await this.loadAll();
    return records.filter((record) => record.requesterId === userId);
  }

  async findByTechnician(technicianId) {
    const records = await this.loadAll();
    return records.filter((record) => record.assignedTechnicianId === technicianId);
  }
}

module.exports = ServiceRequestFileRepository;

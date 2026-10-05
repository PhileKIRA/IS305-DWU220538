const FileRepository = require("./FileRepository");

/** Reads and writes data/auditLog.json. */
class AuditFileRepository extends FileRepository {
  constructor(dataDir) {
    super(dataDir, "auditLog.json", "auditId");
  }

  async findByRequest(requestId) {
    const records = await this.loadAll();
    return records.filter((record) => record.requestId === requestId);
  }
}

module.exports = AuditFileRepository;

const FileRepository = require("./FileRepository");

/**
 * Reads and writes data/requestHistory.json.
 * Each record is one history entry plus the requestId it belongs to.
 */
class RequestHistoryFileRepository extends FileRepository {
  constructor(dataDir) {
    super(dataDir, "requestHistory.json", "historyId");
  }

  async findByRequest(requestId) {
    const records = await this.loadAll();
    return records.filter((record) => record.requestId === requestId);
  }
}

module.exports = RequestHistoryFileRepository;

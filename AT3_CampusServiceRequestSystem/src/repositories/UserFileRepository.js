const FileRepository = require("./FileRepository");

/** Reads and writes data/users.json. */
class UserFileRepository extends FileRepository {
  constructor(dataDir) {
    super(dataDir, "users.json", "userId");
  }
}

module.exports = UserFileRepository;

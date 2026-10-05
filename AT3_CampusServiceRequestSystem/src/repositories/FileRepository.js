const fs = require("fs/promises");
const path = require("path");

/**
 * FileRepository - base class that reads and writes ONE JSON file.
 *
 * Repository pattern: all file access lives here, so the domain classes and the
 * console never touch the file system. Each subclass only says which file it
 * uses and which field is the record ID, and adds its own search methods.
 *
 * Records are plain data objects (from toData()), never class instances.
 */
class FileRepository {
  #filePath;
  #fileName;
  #idField;

  /**
   * @param {string} dataDir  - folder holding the JSON files (tests pass a temporary folder)
   * @param {string} fileName - e.g. "users.json"
   * @param {string} idField  - e.g. "userId"
   */
  constructor(dataDir, fileName, idField) {
    this.#fileName = fileName;
    this.#filePath = path.join(dataDir, fileName);
    this.#idField = idField;
  }

  get fileName() { return this.#fileName; }
  get filePath() { return this.#filePath; }

  /** Reads every record. A missing or empty file is treated as an empty list. */
  async loadAll() {
    let text;
    try {
      text = await fs.readFile(this.#filePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        return []; // file does not exist yet - start with an empty array
      }
      throw new Error(`Could not read ${this.#fileName}: ${error.message}`);
    }

    if (text.trim() === "") {
      return [];
    }
    let records;
    try {
      records = JSON.parse(text);
    } catch {
      throw new Error(`Could not read ${this.#fileName}: the file is not valid JSON.`);
    }
    if (!Array.isArray(records)) {
      throw new Error(`Could not read ${this.#fileName}: expected a list (array) of records.`);
    }
    return records;
  }

  /**
   * Replaces the whole file with these records.
   * Writes to a temporary file first and then renames it, so a failed write
   * cannot leave a half-written, broken JSON file behind.
   */
  async saveAll(records) {
    if (!Array.isArray(records)) {
      throw new Error(`Could not save ${this.#fileName}: records must be an array.`);
    }
    const tempPath = `${this.#filePath}.tmp`;
    try {
      await fs.mkdir(path.dirname(this.#filePath), { recursive: true });
      await fs.writeFile(tempPath, JSON.stringify(records, null, 2), "utf8");
      await fs.rename(tempPath, this.#filePath);
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      throw new Error(`Could not save ${this.#fileName}: ${error.message}`);
    }
  }

  async create(record) {
    const records = await this.loadAll();
    if (records.some((existing) => existing[this.#idField] === record[this.#idField])) {
      throw new Error(`Could not save ${this.#fileName}: ${record[this.#idField]} already exists.`);
    }
    records.push(record);
    await this.saveAll(records);
    return record;
  }

  async findById(id) {
    const records = await this.loadAll();
    return records.find((record) => record[this.#idField] === id) ?? null;
  }

  async update(id, changes) {
    const records = await this.loadAll();
    const index = records.findIndex((record) => record[this.#idField] === id);
    if (index === -1) {
      throw new Error(`Could not update ${this.#fileName}: ${id} not found.`);
    }
    records[index] = { ...records[index], ...changes, [this.#idField]: id };
    await this.saveAll(records);
    return records[index];
  }
}

module.exports = FileRepository;

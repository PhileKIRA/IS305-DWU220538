/*
  Program : Dining Meal Booking Feature - Lab 3 (Distinction Extension)
  File    : RewardsDiningAccount.js
  Student : Philemon KIRA
  ID      : 220538
  Course  : IS305 - Object-Oriented Programming

  Description:
  RewardsDiningAccount is a DERIVED CLASS that INHERITS from
  DiningAccount. It adds a reward rate and demonstrates:
    - class inheritance (extends);
    - CONSTRUCTOR CHAINING using super();
    - METHOD OVERRIDING (displayAccountSummary); and
    - additional specialised behaviour (rewards).
*/

const DiningAccount = require("./DiningAccount");

class RewardsDiningAccount extends DiningAccount {
    // Additional private field for this subclass
    #rewardRate;

    /*
      The subclass constructor calls the base DiningAccount constructor
      using super() - this is CONSTRUCTOR CHAINING. super() initialises
      the account number and opening balance before the subclass
      initialises its own reward rate.
    */
    constructor(accountNumber, openingBalance = 0, rewardRate = 0) {
        super(accountNumber, openingBalance);

        if (typeof rewardRate !== "number" || Number.isNaN(rewardRate)) {
            throw new Error("Reward rate must be a number.");
        }

        if (rewardRate < 0) {
            throw new Error("Reward rate cannot be negative.");
        }

        this.#rewardRate = rewardRate;
    }

    // Reward rate getter
    getRewardRate() {
        return this.#rewardRate;
    }

    /*
      Reward = current balance x reward rate / 100
      (This only calculates the reward - it does not change the balance.)
    */
    calculateReward() {
        return (this.getBalance() * this.#rewardRate) / 100;
    }

    /*
      Calculate the reward and add it to the account, recording the
      reward as a transaction. Returns the reward amount that was applied.
    */
    applyReward() {
        const reward = this.calculateReward();

        if (reward > 0) {
            // _credit is the protected helper inherited from the base class
            this._credit(reward, "Reward", "Reward earned");
        }

        return reward;
    }

    /*
      METHOD OVERRIDING.
      Extend the base summary with the reward rate. super.displayAccountSummary()
      reuses the base class output, then this method adds specialised detail.
    */
    displayAccountSummary() {
        super.displayAccountSummary();
        console.log(`Reward Rate    : ${this.#rewardRate}%`);
    }
}

module.exports = RewardsDiningAccount;

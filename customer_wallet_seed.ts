import sequelize from "./src/config/db.ts";
import { faker } from "@faker-js/faker";
import { Customer } from "./src/models/customer.ts";
import Wallet from "./src/models/wallet.ts";
import { Currency, WalletType } from "./src/types/wallet.ts";
import { createWalletNumber } from "./src/util/wallet_number.ts";

/**
 * Generates a set of fake but valid customers and wallets.
 * Ensures unique wallet per (walletType + currency + customerId) as
 * per index constraint.
 */
export async function seedDatabase(
  numCustomers = 20,
  maxWalletsPerCustomer = 3
): Promise<void> {
  console.log("Starting robust database seeding...");
  const prefixes = ["070", "080", "090", "081", "020"];

  try {
    // Generate fake customers
    const customersData = Array.from({ length: numCustomers }).map(() => {
      const prefix = faker.helpers.arrayElement(prefixes);
      const phoneNumber = `${prefix}${faker.string.numeric(
        10 - prefix.length
      )}`;
      const fullName = faker.person.fullName();
      return {
        fullName: faker.person.fullName(),
        phoneNumber,
        email: faker.internet.email({
          firstName: fullName.split(" ")[0] || ""
        }),
        status: faker.helpers.arrayElement(["active", "inactive"])
      };
    });

    const customers = await Customer.bulkCreate(customersData, {
      returning: true
    });

    console.log(`Created ${customers.length} customers.`);

    // Generate wallets for each customer
    for (const customer of customers) {
      // Create unique wallet combos per customer
      const possibleCombos = Object.values(WalletType).flatMap((type) =>
        Object.values(Currency).map((currency) => ({ type, currency }))
      );

      const selectedCombos = faker.helpers.arrayElements(
        possibleCombos,
        faker.number.int({ min: 1, max: maxWalletsPerCustomer })
      );

      for (const { type, currency } of selectedCombos) {
        const walletNumber = await createWalletNumber(type);

        await Wallet.create({
          walletNumber,
          walletType: type,
          currency,
          customerId: customer.id,
          balance: faker.number.float({
            min: 1000,
            max: 100000,
            fractionDigits: 2
          })
        });

        console.log(
          `Wallet created: ${walletNumber} | ${type} | ${currency} | Customer ${customer.id}`
        );
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();

import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { Sequelize, DataTypes } from "sequelize";
const app = express();
app.use(bodyParser.json());
// Setup DB (SQLite for demo)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false
});
// Wallet model
const Wallet = sequelize.define("Wallet", {
    customer_name: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.FLOAT, defaultValue: 0 }
});
// Transaction model
const Transaction = sequelize.define("Transaction", {
    type: { type: DataTypes.ENUM("deposit", "withdrawal", "loan") },
    amount: { type: DataTypes.FLOAT, allowNull: false }
});
Wallet.hasMany(Transaction);
Transaction.belongsTo(Wallet);
// Deposit
app.post("/deposit", async (req, res) => {
    const { walletId, amount } = req.body;
    const wallet = await Wallet.findByPk(walletId);
    wallet.balance += amount;
    await wallet.save();
    await Transaction.create({ walletId, type: "deposit", amount });
    res.json(wallet);
});
// Withdraw
app.post("/withdraw", async (req, res) => {
    const { walletId, amount } = req.body;
    const wallet = await Wallet.findByPk(walletId);
    if (wallet.balance < amount)
        return res.status(400).send("Insufficient funds");
    wallet.balance -= amount;
    await wallet.save();
    await Transaction.create({ walletId, type: "withdrawal", amount });
    res.json(wallet);
});
// Loan (increase balance, mark as loan)
app.post("/loan", async (req, res) => {
    const { walletId, amount } = req.body;
    const wallet = await Wallet.findByPk(walletId);
    wallet.balance += amount;
    await wallet.save();
    await Transaction.create({ walletId, type: "loan", amount });
    res.json(wallet);
});
// Get balance
app.get("/wallet/:id", async (req, res) => {
    const wallet = await Wallet.findByPk(req.params.id);
    res.json(wallet);
});
// Sync DB and start
sequelize.sync().then(() => {
    app.listen(3000, () => console.log("Agency banking API running on port 3000"));
});
//# sourceMappingURL=server.js.map
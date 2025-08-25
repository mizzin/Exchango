// models/transaction.js 0721
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('transaction', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('recharge', 'withdraw', 'wallet_charge', 'wallet_withdraw'),
      allowNull: false
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    }, 
    currency: {
      type: DataTypes.STRING,
      allowNull: false
    },
    exchange_rate: {
      type: DataTypes.FLOAT
    },
    converted_amount: {
      type: DataTypes.FLOAT
    },
    memo: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'transactions',
    timestamps: false
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.user, { foreignKey: 'user_id', as: 'user' });
  };

  return Transaction;
};

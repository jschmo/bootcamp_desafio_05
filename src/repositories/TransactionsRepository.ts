import { EntityRepository, Repository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface CategoryDTO {
  id: string;
  title: string;
}

interface CreateTransactionDTO {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: CategoryDTO;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = await transactionsRepository.find();
    const balance = transactions.reduce(
      (accumulator: Balance, transaction: Transaction) => {
        switch (transaction.type) {
          case 'income':
            accumulator.income += transaction.value;
            break;
          case 'outcome':
            accumulator.outcome += transaction.value;
            break;
          default:
            break;
        }
        return accumulator;
      },
      {
        income: 0,
        outcome: 0,
        total: 0,
      },
    );
    balance.total = balance.income - balance.outcome;
    return balance;
  }

  public async getTransactions(): Promise<CreateTransactionDTO[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions = transactionsRepository.find({
      select: ['id', 'title', 'value', 'type', 'created_at', 'updated_at'],
      relations: ['category'],
    });
    return transactions;
  }
}

export default TransactionsRepository;

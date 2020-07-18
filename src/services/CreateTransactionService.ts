import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Invalid transaction type');
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (value > total) {
        throw new AppError('Not enough balance');
      }
    }
    const category_id = await this.getCategory(category);
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }

  private async getCategory(category: string): Promise<string> {
    const categoriesRepo = getRepository(Category);
    const checkCategory = await categoriesRepo.findOne({
      where: { title: category },
    });
    if (!checkCategory) {
      const newCategory = categoriesRepo.create({ title: category });
      await categoriesRepo.save(newCategory);
      return newCategory.id;
    }
    return checkCategory.id;
  }
}

export default CreateTransactionService;

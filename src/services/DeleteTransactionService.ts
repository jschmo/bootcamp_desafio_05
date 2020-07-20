import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transacationRepo = getCustomRepository(TransactionsRepository);
    const transaction = await transacationRepo.findOne({ where: { id } });
    if (!transaction) {
      throw new AppError('Transacation not found', 400);
    }
    await transacationRepo.remove(transaction);
  }
}
export default DeleteTransactionService;

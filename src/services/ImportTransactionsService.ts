import fs from 'fs';
import { getRepository, In, getCustomRepository } from 'typeorm';
import csvParse from 'csv-parse';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactReadStream = fs.createReadStream(filePath);
    const parseStream = csvParse({ from_line: 2, ltrim: true, rtrim: true });

    const parseCSV = contactReadStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !type || !value) return;
      categories.push(category);

      const trans: CSVTransaction = { title, type, value, category };
      transactions.push(trans);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const filteredCategories = Array.from(new Set(categories));

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(filteredCategories),
      },
    });
    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );
    const addCategoriesTitles = filteredCategories.filter(
      category => !existentCategoriesTitles.includes(category),
    );
    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);
    const finalCategories = await categoriesRepository.find();

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);
    return createdTransactions;
  }
}

export default ImportTransactionsService;

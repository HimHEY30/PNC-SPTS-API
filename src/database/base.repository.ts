export interface PaginationOptions {
  skip?: number;
  take?: number;
  cursor?: any;
  where?: any;
  orderBy?: any;
}

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  protected constructor(protected readonly model: any) {}

  async findAll(params: PaginationOptions = {}): Promise<T[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.model.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(where: any): Promise<T | null> {
    return this.model.findUnique({
      where,
    });
  }

  async findFirst(where: any): Promise<T | null> {
    return this.model.findFirst({
      where,
    });
  }

  async create(data: CreateDTO): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async update(where: any, data: UpdateDTO): Promise<T> {
    return this.model.update({
      where,
      data,
    });
  }

  async delete(where: any): Promise<T> {
    return this.model.delete({
      where,
    });
  }

  // Implementing soft delete as per your original architecture rules
  async softDelete(where: any): Promise<T> {
    return this.model.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }
}
